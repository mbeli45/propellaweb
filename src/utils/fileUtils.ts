/** Max upload size for property media on the web app (mobile app can upload larger via r2-media). */
export const MAX_WEB_MEDIA_UPLOAD_BYTES = 50 * 1024 * 1024

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

export function isVideoFile(file: File): boolean {
  return (
    file.type.startsWith('video/') ||
    /\.(mp4|mov|avi|mkv|webm)$/i.test(file.name)
  )
}

export function isOverWebUploadLimit(file: File): boolean {
  return file.size > MAX_WEB_MEDIA_UPLOAD_BYTES
}
