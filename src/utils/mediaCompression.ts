/**
 * Browser media compression for Propella Web (Vite).
 * - Images: Canvas resize + quality (no extra deps).
 * - Large videos: @ffmpeg/ffmpeg + single-thread UMD @ffmpeg/core (no COOP/COEP; see ffmpeg.wasm docs).
 */

import type { FFmpeg } from '@ffmpeg/ffmpeg'

export interface CompressionOptions {
  maxSizeMB?: number
  maxWidthOrHeight?: number
  quality?: number
  /** MIME type for canvas.toBlob (e.g. image/jpeg) */
  fileType?: string
}

let ffmpegLoadPromise: Promise<FFmpeg> | null = null

async function loadWebFfmpeg(): Promise<FFmpeg> {
  if (!ffmpegLoadPromise) {
    ffmpegLoadPromise = (async () => {
      const { FFmpeg } = await import('@ffmpeg/ffmpeg')
      const { toBlobURL } = await import('@ffmpeg/util')
      const ffmpeg = new FFmpeg()
      const base = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'
      await ffmpeg.load({
        coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, 'application/wasm'),
      })
      return ffmpeg
    })().catch((err) => {
      ffmpegLoadPromise = null
      throw err
    })
  }
  return ffmpegLoadPromise
}

function baseNameFromFileName(name: string): string {
  const i = name.lastIndexOf('.')
  return i > 0 ? name.slice(0, i) : name
}

/**
 * Compress an image file using canvas (works in all modern browsers).
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const {
    maxSizeMB = 10,
    maxWidthOrHeight = 1920,
    quality = 0.8,
    fileType = file.type || 'image/jpeg',
  } = options

  const maxBytes = maxSizeMB * 1024 * 1024
  if (file.size <= maxBytes) {
    return file
  }

  const blobMime =
    fileType === 'image/png' && quality > 0.55 ? 'image/png' : 'image/jpeg'

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > maxWidthOrHeight) {
            height = (height * maxWidthOrHeight) / width
            width = maxWidthOrHeight
          }
        } else {
          if (height > maxWidthOrHeight) {
            width = (width * maxWidthOrHeight) / height
            height = maxWidthOrHeight
          }
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'))
              return
            }

            if (blob.size > maxBytes && quality > 0.42) {
              const stepFile = new File(
                [blob],
                `${baseNameFromFileName(file.name)}.jpg`,
                { type: 'image/jpeg', lastModified: Date.now() }
              )
              compressImage(stepFile, {
                ...options,
                quality: quality - 0.1,
                maxWidthOrHeight: Math.max(640, Math.floor(maxWidthOrHeight * 0.88)),
                fileType: 'image/jpeg',
              })
                .then(resolve)
                .catch(reject)
              return
            }

            const outName =
              blobMime === 'image/jpeg'
                ? `${baseNameFromFileName(file.name)}.jpg`
                : file.name
            const compressedFile = new File([blob], outName, {
              type: blob.type || blobMime,
              lastModified: Date.now(),
            })
            resolve(compressedFile)
          },
          blobMime,
          quality
        )
      }
      img.onerror = () => reject(new Error('Failed to load image'))
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
  })
}

export function isVideoFile(file: File): boolean {
  return (
    file.type.startsWith('video/') ||
    /\.(mp4|mov|avi|mkv|webm)$/i.test(file.name)
  )
}

export function isImageFile(file: File): boolean {
  return (
    file.type.startsWith('image/') ||
    /\.(jpg|jpeg|png|gif|webp|heic|heif)$/i.test(file.name)
  )
}

/**
 * Compress video with FFmpeg.wasm; returns original file if load/encode fails or size not improved.
 */
export async function compressVideoFile(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const maxSizeMB = options.maxSizeMB ?? 10
  const maxBytes = maxSizeMB * 1024 * 1024
  if (file.size <= maxBytes) {
    return file
  }

  const url = URL.createObjectURL(file)
  try {
    const ffmpeg = await loadWebFfmpeg()
    const { fetchFile } = await import('@ffmpeg/util')
    await ffmpeg.writeFile('input.bin', await fetchFile(url))
    await ffmpeg.exec([
      '-y',
      '-i',
      'input.bin',
      '-vf',
      'scale=1280:-2:force_original_aspect_ratio=decrease',
      '-c:v',
      'libx264',
      '-crf',
      '28',
      '-preset',
      'veryfast',
      '-movflags',
      '+faststart',
      '-c:a',
      'aac',
      '-b:a',
      '96k',
      'output.mp4',
    ])
    const raw = await ffmpeg.readFile('output.mp4')
    const outBlob = new Blob([raw as BlobPart], { type: 'video/mp4' })
    const outName = `${baseNameFromFileName(file.name)}.mp4`
    const outFile = new File([outBlob], outName, {
      type: 'video/mp4',
      lastModified: Date.now(),
    })

    if (outFile.size <= maxBytes) {
      console.log(
        `[mediaCompression] Video compressed to under ${maxSizeMB} MB: ${formatFileSize(outFile.size)}`
      )
      return outFile
    }
    if (outFile.size < file.size) {
      console.log(
        `[mediaCompression] Video compressed ${formatFileSize(file.size)} → ${formatFileSize(outFile.size)}`
      )
      return outFile
    }
    return file
  } catch (e) {
    console.warn('[mediaCompression] Web video compression failed:', e)
    return file
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function compressMedia(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  if (isImageFile(file)) {
    return compressImage(file, options)
  }
  if (isVideoFile(file)) {
    return compressVideoFile(file, options)
  }
  return file
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}
