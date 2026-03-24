import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY
const imageUploadProvider = import.meta.env.VITE_PUBLIC_IMAGE_UPLOAD_PROVIDER || 'supabase'
const r2FunctionName = import.meta.env.VITE_PUBLIC_R2_FUNCTION_NAME || 'r2-media'

export type UploadResult = {
  url: string
  path: string
  error?: string
}

export const useStorage = () => {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const shouldUseR2Proxy = (bucket: string) => imageUploadProvider === 'r2_proxy' && bucket === 'properties'

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    if (!supabaseAnonKey) {
      throw new Error('Missing Supabase anon key for function authentication')
    }

    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) {
      throw new Error('You must be signed in to upload files')
    }

    return {
      Authorization: `Bearer ${session.access_token}`,
      apikey: supabaseAnonKey,
    }
  }

  const getR2FunctionEndpoint = () => {
    if (!supabaseUrl) {
      throw new Error('Missing Supabase URL for function endpoint')
    }
    return `${supabaseUrl}/functions/v1/${r2FunctionName}`
  }

  const uploadViaR2Proxy = async (
    file: File | string,
    folder: string,
    fileOrBlob?: Blob
  ): Promise<UploadResult> => {
    const endpoint = getR2FunctionEndpoint()
    const headers = await getAuthHeaders()
    const formData = new FormData()
    formData.append('folder', folder)

    let fileToUpload: File | Blob

    if (file instanceof File) {
      fileToUpload = file
    } else if (fileOrBlob) {
      fileToUpload = fileOrBlob
    } else if (typeof file === 'string' && file.startsWith('blob:')) {
      const response = await fetch(file)
      fileToUpload = await response.blob()
    } else if (typeof file === 'string' && file.startsWith('data:')) {
      const response = await fetch(file)
      fileToUpload = await response.blob()
    } else {
      throw new Error('Invalid file format')
    }

    const fileName = fileToUpload instanceof File ? fileToUpload.name : `image-${Date.now()}.jpg`
    formData.append('file', fileToUpload, fileName)

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: formData,
    })

    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error(payload?.error || 'R2 upload failed')
    }

    if (!payload?.url || !payload?.path) {
      throw new Error('Invalid upload response from R2 proxy')
    }

    return {
      url: payload.url,
      path: payload.path,
    }
  }

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

      if (shouldUseR2Proxy(bucket)) {
        const result = await uploadViaR2Proxy(file, folder, fileOrBlob)
        setUploading(false)
        setProgress(100)
        return result
      }

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
      if (shouldUseR2Proxy(bucket)) {
        const endpoint = getR2FunctionEndpoint()
        const headers = await getAuthHeaders()
        const response = await fetch(endpoint, {
          method: 'DELETE',
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ key: path }),
        })

        const payload = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(payload?.error || 'Failed to delete media from R2')
        }
        return true
      }

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
