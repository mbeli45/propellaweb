import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL

export type UploadResult = {
  url: string
  path: string
  error?: string
}

export const useStorage = () => {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  /**
   * Pick an image or video from file input (web version)
   */
  const pickImage = async (allowMultiple: boolean = false): Promise<File[] | File | null> => {
    return new Promise((resolve) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*,video/*'
      input.multiple = allowMultiple
      input.onchange = (e: Event) => {
        const target = e.target as HTMLInputElement
        if (target.files && target.files.length > 0) {
          const files = Array.from(target.files)
          resolve(allowMultiple ? files : files[0])
        } else {
          resolve(null)
        }
      }
      input.click()
    })
  }

  /**
   * Take a photo using device camera (web version)
   */
  const takePhoto = async (): Promise<File | null> => {
    return new Promise((resolve) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.capture = 'environment' // Use back camera if available
      input.onchange = (e: Event) => {
        const target = e.target as HTMLInputElement
        if (target.files && target.files.length > 0) {
          resolve(target.files[0])
        } else {
          resolve(null)
        }
      }
      input.click()
    })
  }

  /**
   * Upload an image to Supabase Storage
   */
  const uploadImage = async (
    file: File | string,
    bucket: string = 'properties',
    folder: string = 'uploads',
    fileOrBlob?: Blob
  ): Promise<UploadResult | null> => {
    try {
      setUploading(true)
      setProgress(0)
      setError(null)

      let fileToUpload: File | Blob

      if (file instanceof File) {
        fileToUpload = file
      } else if (fileOrBlob) {
        fileToUpload = fileOrBlob
      } else if (typeof file === 'string' && file.startsWith('blob:')) {
        const response = await fetch(file)
        const blob = await response.blob()
        fileToUpload = new File([blob], 'image.jpg', { type: blob.type })
      } else if (typeof file === 'string' && file.startsWith('data:')) {
        const response = await fetch(file)
        const blob = await response.blob()
        fileToUpload = new File([blob], 'image.jpg', { type: blob.type })
      } else {
        throw new Error('Invalid file format')
      }

      // Determine file extension and content type
      let fileExt = 'jpg'
      let contentType = 'image/jpeg'
      
      if (fileToUpload instanceof File) {
        fileExt = fileToUpload.name.split('.').pop()?.toLowerCase() || 'jpg'
        // Use the file's actual MIME type if available (most reliable)
        if (fileToUpload.type) {
          contentType = fileToUpload.type
        } else {
          // Fallback: determine from extension
          if (fileExt === 'mp4') contentType = 'video/mp4'
          else if (fileExt === 'mov') contentType = 'video/quicktime'
          else if (fileExt === 'avi') contentType = 'video/x-msvideo'
          else if (fileExt === 'mkv') contentType = 'video/x-matroska'
          else if (fileExt === 'webm') contentType = 'video/webm'
          else if (fileExt === 'png') contentType = 'image/png'
          else if (fileExt === 'gif') contentType = 'image/gif'
          else if (fileExt === 'webp') contentType = 'image/webp'
          else contentType = 'image/jpeg' // Default
        }
      }
      
      const fileName = `${uuidv4()}.${fileExt}`
      const filePath = `${folder}/${fileName}`

      setProgress(50)

      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, fileToUpload, {
          contentType: contentType,
          upsert: true,
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path)

      setUploading(false)
      setProgress(100)

      return {
        url: publicUrl,
        path: data.path,
      }
    } catch (error: any) {
      setUploading(false)
      setError(error.message || 'Failed to upload image')
      return {
        url: '',
        path: '',
        error: error.message || 'Failed to upload image',
      }
    }
  }

  /**
   * Upload multiple images
   */
  const uploadMultipleImages = async (
    files: (File | string)[],
    bucket: string = 'properties',
    folder: string = 'uploads'
  ): Promise<UploadResult[]> => {
    const results: UploadResult[] = []

    for (let i = 0; i < files.length; i++) {
      setProgress((i / files.length) * 100)
      const result = await uploadImage(files[i], bucket, folder)
      if (result) {
        results.push(result)
      }
    }

    setProgress(100)
    return results
  }

  /**
   * Upload a generic file
   */
  const uploadFile = async (
    file: File | string,
    mimeType: string = 'application/octet-stream',
    bucket: string = 'message-media',
    folder: string = 'uploads'
  ): Promise<UploadResult | null> => {
    try {
      setUploading(true)
      setProgress(0)
      setError(null)

      let fileToUpload: File | Blob

      if (file instanceof File) {
        fileToUpload = file
      } else if (typeof file === 'string' && file.startsWith('blob:')) {
        const response = await fetch(file)
        fileToUpload = await response.blob()
      } else {
        throw new Error('Invalid file format')
      }

      const fileExt = fileToUpload instanceof File
        ? fileToUpload.name.split('.').pop()?.toLowerCase() || 'bin'
        : mimeType.split('/').pop() || 'bin'
      const fileName = `${uuidv4()}.${fileExt}`
      const filePath = `${folder}/${fileName}`

      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, fileToUpload, {
          contentType: mimeType,
          upsert: true,
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path)

      setUploading(false)
      setProgress(100)

      return {
        url: publicUrl,
        path: data.path,
      }
    } catch (error: any) {
      setUploading(false)
      setError(error.message || 'Failed to upload file')
      return {
        url: '',
        path: '',
        error: error.message || 'Failed to upload file',
      }
    }
  }

  /**
   * Delete an image from Supabase Storage
   */
  const deleteImage = async (path: string, bucket: string = 'properties'): Promise<boolean> => {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path])

      if (error) throw error
      return true
    } catch (error: any) {
      setError(error.message || 'Failed to delete image')
      return false
    }
  }

  return {
    pickImage,
    takePhoto,
    uploadImage,
    uploadMultipleImages,
    uploadFile,
    deleteImage,
    uploading,
    progress,
    error,
  }
}
