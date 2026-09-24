/**
 * Checks if a URL is a video file
 */
export function isVideoUrl(url: string): boolean {
  if (!url) return false
  const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v']
  const lowerUrl = url.toLowerCase()
  return videoExtensions.some(ext => lowerUrl.includes(ext))
}

// Keep a bounded cache across navigation; failed requests may be retried later.
const thumbnailCache = new Map<string, string>()

/** Read a single frame, then release the video source on every exit path. */
export function generateVideoThumbnail(videoUrl: string, signal?: AbortSignal): Promise<string | null> {
  if (signal?.aborted) return Promise.resolve(null)
  const cached = thumbnailCache.get(videoUrl)
  if (cached) return Promise.resolve(cached)
  return new Promise((resolve) => {
    const video = document.createElement('video')
    let settled = false
    const finish = (image: string | null) => {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      signal?.removeEventListener('abort', abort)
      video.onloadedmetadata = null
      video.onloadeddata = null
      video.onseeked = null
      video.onerror = null
      video.pause()
      video.removeAttribute('src')
      video.load()
      if (image) {
        if (thumbnailCache.size >= 60) thumbnailCache.delete(thumbnailCache.keys().next().value!)
        thumbnailCache.set(videoUrl, image)
      }
      resolve(image)
    }
    const abort = () => finish(null)
    const timeout = setTimeout(abort, 10000)
    signal?.addEventListener('abort', abort, { once: true })
    const capture = () => {
      if (!video.videoWidth || video.readyState < 2) return
      try {
        const canvas = document.createElement('canvas')
        const scale = Math.min(1, 480 / video.videoWidth)
        canvas.width = Math.round(video.videoWidth * scale)
        canvas.height = Math.round(video.videoHeight * scale)
        const context = canvas.getContext('2d', { alpha: false })
        if (!context) return finish(null)
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        finish(canvas.toDataURL('image/jpeg', 0.7))
      } catch { finish(null) }
    }
    video.crossOrigin = 'anonymous'
    video.preload = 'metadata'
    video.muted = true
    video.playsInline = true
    video.onloadedmetadata = () => {
      const frameTime = Number.isFinite(video.duration) ? Math.min(0.1, video.duration / 2) : 0
      if (frameTime > 0) video.currentTime = frameTime
    }
    video.onloadeddata = () => { if (!video.seeking) capture() }
    video.onseeked = capture
    video.onerror = abort
    video.src = videoUrl
    video.load()
  })
}
/**
 * Separates videos from images in a media array
 */
export function separateMedia(media: string[]): {
  images: string[]
  videos: string[]
} {
  const images: string[] = []
  const videos: string[] = []
  
  media.forEach(url => {
    if (isVideoUrl(url)) {
      videos.push(url)
    } else {
      images.push(url)
    }
  })
  
  return { images, videos }
}
