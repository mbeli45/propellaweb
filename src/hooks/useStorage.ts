import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY
// Cloudflare R2 is the storage backend for all user media. Supabase Storage is
// only reachable by explicitly setting the provider to 'supabase'.
const imageUploadProvider = import.meta.env.VITE_PUBLIC_IMAGE_UPLOAD_PROVIDER || 'r2_proxy'
const r2FunctionName = import.meta.env.VITE_PUBLIC_R2_FUNCTION_NAME || 'r2-media'

export type UploadResult = {
  url: string
  path: string
  error?: string
}

export type PendingUploadItem = {
  id: string
  file: File | string
  /** Object URL for local File previews; revoked when the item leaves the queue */
  previewUrl?: string
  bucket: string
  folder: string
  createdAt: number
  status?: 'uploading' | 'failed'
  propertyDraft?: {
    title?: string
    location?: string
    price?: number
    type?: 'rent' | 'sale'
    category?: 'budget' | 'standard' | 'premium' | 'luxury'
  }
}

const previewUrlForPendingFile = (file: File | string): string | undefined => {
  if (file instanceof File) {
    return URL.createObjectURL(file)
  }
  return undefined
}

const PENDING_UPLOADS_KEY = 'propellaweb:pendingMediaUploads'
let sharedPendingUploads: PendingUploadItem[] = []
const pendingUploadSubscribers = new Set<(items: PendingUploadItem[]) => void>()

const publishPendingUploads = (items: PendingUploadItem[]) => {
  sharedPendingUploads = items
  pendingUploadSubscribers.forEach((subscriber) => subscriber(items))
}

export const useStorage = () => {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [pendingUploads, setPendingUploads] = useState<PendingUploadItem[]>([])

  // Every bucket goes to R2, not just property media. The bucket name becomes the
  // R2 key prefix so objects stay grouped the way they were under Supabase Storage.
  const shouldUseR2Proxy = (_bucket: string) => imageUploadProvider === 'r2_proxy'

  const r2FolderFor = (bucket: string, folder: string) =>
    [bucket, folder].filter((part) => part && part.trim().length > 0).join('/')

  useEffect(() => {
    const subscriber = (items: PendingUploadItem[]) => {
      setPendingUploads(items)
    }
    pendingUploadSubscribers.add(subscriber)
    subscriber(sharedPendingUploads)

    if (sharedPendingUploads.length === 0) {
      try {
        const raw = sessionStorage.getItem(PENDING_UPLOADS_KEY)
        if (raw) {
          const parsed = JSON.parse(raw) as Array<Omit<PendingUploadItem, 'file'> & { fileName: string }>
          if (Array.isArray(parsed)) {
            const restored = parsed.map((item) => ({
              id: item.id,
              file: item.fileName,
              bucket: item.bucket,
              folder: item.folder,
              createdAt: item.createdAt,
              status: 'failed' as const,
              propertyDraft: item.propertyDraft,
            }))
            publishPendingUploads(restored)
          }
        }
      } catch {
        publishPendingUploads([])
      }
    }

    return () => {
      pendingUploadSubscribers.delete(subscriber)
    }
  }, [])

  const persistPendingMeta = (items: PendingUploadItem[]) => {
    const meta = items.map((item) => ({
      id: item.id,
      fileName: typeof item.file === 'string' ? item.file : item.file.name,
      bucket: item.bucket,
      folder: item.folder,
      createdAt: item.createdAt,
      status: item.status,
      propertyDraft: item.propertyDraft,
    }))
    sessionStorage.setItem(PENDING_UPLOADS_KEY, JSON.stringify(meta))
  }

  const syncPendingUploads = (items: PendingUploadItem[]) => {
    const nextIds = new Set(items.map((i) => i.id))
    for (const item of sharedPendingUploads) {
      if (!nextIds.has(item.id) && item.previewUrl) {
        try {
          URL.revokeObjectURL(item.previewUrl)
        } catch {
          /* ignore */
        }
      }
    }
    publishPendingUploads(items)
    persistPendingMeta(items)
  }

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

    // A Blob carries its own MIME type; name it with a matching extension so
    // documents and audio don't land in R2 as `.jpg`.
    const extFromType = (fileToUpload.type || '').split('/')[1]?.split(';')[0] || 'jpg'
    const fileName =
      fileToUpload instanceof File ? fileToUpload.name : `upload-${Date.now()}.${extFromType}`
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
        const result = await uploadViaR2Proxy(file, r2FolderFor(bucket, folder), fileOrBlob)
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
          // Fallback: determine from extension. Includes the iOS formats (.heic/.heif
          // from the camera, .m4v/.qt from the library) that previously fell through to
          // image/jpeg and mislabelled the stored object.
          if (fileExt === 'mp4') contentType = 'video/mp4'
          else if (fileExt === 'mov' || fileExt === 'qt') contentType = 'video/quicktime'
          else if (fileExt === 'm4v') contentType = 'video/x-m4v'
          else if (fileExt === 'avi') contentType = 'video/x-msvideo'
          else if (fileExt === 'mkv') contentType = 'video/x-matroska'
          else if (fileExt === 'webm') contentType = 'video/webm'
          else if (fileExt === '3gp') contentType = 'video/3gpp'
          else if (fileExt === 'png') contentType = 'image/png'
          else if (fileExt === 'gif') contentType = 'image/gif'
          else if (fileExt === 'webp') contentType = 'image/webp'
          else if (fileExt === 'heic') contentType = 'image/heic'
          else if (fileExt === 'heif') contentType = 'image/heif'
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
    folder: string = 'uploads',
    propertyDraft?: PendingUploadItem['propertyDraft']
  ): Promise<UploadResult[]> => {
    const results: UploadResult[] = []
    const queuedNow: PendingUploadItem[] = files.map((file, index) => ({
      id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
      file,
      previewUrl: previewUrlForPendingFile(file),
      bucket,
      folder,
      createdAt: Date.now(),
      status: 'uploading',
      propertyDraft,
    }))
    let currentQueue = [...sharedPendingUploads, ...queuedNow]
    syncPendingUploads(currentQueue)

    for (let i = 0; i < files.length; i++) {
      setProgress((i / files.length) * 100)
      const result = await uploadImage(files[i], bucket, folder)
      const queuedItem = queuedNow[i]
      if (result) {
        results.push(result)
        if (!result.error) {
          currentQueue = currentQueue.filter((item) => item.id !== queuedItem.id)
          syncPendingUploads(currentQueue)
        } else {
          currentQueue = currentQueue.map((item) => item.id === queuedItem.id ? { ...item, status: 'failed' } : item)
          syncPendingUploads(currentQueue)
        }
      }
    }

    setProgress(100)
    return results
  }

  const enqueuePendingUploads = async (
    files: (File | string)[],
    bucket: string = 'properties',
    folder: string = 'uploads',
    propertyDraft?: PendingUploadItem['propertyDraft']
  ) => {
    const queued = [
      ...sharedPendingUploads,
      ...files.map((file, index) => ({
        id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        previewUrl: previewUrlForPendingFile(file),
        bucket,
        folder,
        createdAt: Date.now(),
        status: 'uploading' as const,
        propertyDraft,
      })),
    ]
    syncPendingUploads(queued)
  }

  const retryPendingUploads = async (): Promise<UploadResult[]> => {
    if (pendingUploads.length === 0) return []
    const results: UploadResult[] = []
    const stillPending: PendingUploadItem[] = []
    for (let i = 0; i < pendingUploads.length; i++) {
      const item = pendingUploads[i]
      const result = await uploadImage(item.file, item.bucket, item.folder)
      if (result) {
        results.push(result)
        if (result.error) stillPending.push(item)
      } else {
        stillPending.push(item)
      }
    }
    syncPendingUploads(stillPending)
    return results
  }

  const retryPendingUpload = async (id: string): Promise<UploadResult | null> => {
    const item = sharedPendingUploads.find((p) => p.id === id)
    if (!item) return null
    if (typeof item.file === 'string' && !item.file.startsWith('blob:') && !item.file.startsWith('data:')) {
      return {
        url: '',
        path: '',
        error: 'Original file is unavailable after navigation refresh. Please re-add media.',
      }
    }
    syncPendingUploads(sharedPendingUploads.map((p) => p.id === id ? { ...p, status: 'uploading' } : p))
    const result = await uploadImage(item.file, item.bucket, item.folder)
    if (result && !result.error) {
      const remaining = sharedPendingUploads.filter((p) => p.id !== id)
      syncPendingUploads(remaining)
    } else {
      syncPendingUploads(sharedPendingUploads.map((p) => p.id === id ? { ...p, status: 'failed' } : p))
    }
    return result
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

      if (shouldUseR2Proxy(bucket)) {
        const result = await uploadViaR2Proxy(file, r2FolderFor(bucket, folder))
        setUploading(false)
        setProgress(100)
        return result
      }

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
          // The function resolves either form; send a URL as `url` so it can
        // strip the public base itself rather than treating it as a key.
        body: JSON.stringify(/^https?:\/\//i.test(path) ? { url: path } : { key: path }),
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
    enqueuePendingUploads,
    retryPendingUploads,
    retryPendingUpload,
    uploadFile,
    deleteImage,
    uploading,
    progress,
    error,
    pendingUploadCount: pendingUploads.length,
    pendingUploads,
  }
}
