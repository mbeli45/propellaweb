/**
 * Media compression utilities for images and videos
 */

export interface CompressionOptions {
  maxSizeMB?: number
  maxWidthOrHeight?: number
  quality?: number
  fileType?: string
}

/**
 * Compress an image file
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const {
    maxSizeMB = 10,
    maxWidthOrHeight = 1920,
    quality = 0.8,
    fileType = file.type
  } = options

  // If file is already small enough, return it
  if (file.size <= maxSizeMB * 1024 * 1024) {
    return file
  }

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

        // Calculate new dimensions
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

            // If compressed file is still too large, reduce quality further
            if (blob.size > maxSizeMB * 1024 * 1024 && quality > 0.5) {
              compressImage(file, { ...options, quality: quality - 0.1 })
                .then(resolve)
                .catch(reject)
              return
            }

            const compressedFile = new File([blob], file.name, {
              type: fileType,
              lastModified: Date.now()
            })
            resolve(compressedFile)
          },
          fileType,
          quality
        )
      }
      img.onerror = () => reject(new Error('Failed to load image'))
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
  })
}

/**
 * Check if a file is a video
 */
export function isVideoFile(file: File): boolean {
  return file.type.startsWith('video/') || 
         file.name.toLowerCase().match(/\.(mp4|mov|avi|mkv|webm)$/) !== null
}

/**
 * Check if a file is an image
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/') || 
         file.name.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/) !== null
}

/**
 * Compress media file (image or video)
 */
export async function compressMedia(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  if (isImageFile(file)) {
    return compressImage(file, options)
  }
  
  // For videos, we can't easily compress in the browser
  // Return the original file with a warning
  if (isVideoFile(file)) {
    console.warn('Video compression not supported in browser. Consider using a smaller video file.')
    return file
  }

  return file
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}
