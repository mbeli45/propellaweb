/**
 * Checks if a URL is a video file
 */
export function isVideoUrl(url: string): boolean {
  if (!url) return false
  const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v']
  const lowerUrl = url.toLowerCase()
  return videoExtensions.some(ext => lowerUrl.includes(ext))
}

/**
 * Generates a thumbnail from a video URL.
 * Returns a data URL on success, or null if generation fails (CORS, network, format).
 * Callers should fall back to a <video preload="metadata"> element when null.
 */
export function generateVideoThumbnail(videoUrl: string): Promise<string | null> {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    video.crossOrigin = 'anonymous'
    video.preload = 'metadata'
    video.muted = true

    const timeout = setTimeout(() => {
      resolve(null)
    }, 5000)

    video.onloadedmetadata = () => {
      const seekTime = Math.min(1, video.duration * 0.1)
      video.currentTime = seekTime
    }

    video.onseeked = () => {
      clearTimeout(timeout)
      try {
        const canvas = document.createElement('canvas')
        const maxWidth = 400
        const maxHeight = 300
        const aspectRatio = video.videoWidth / video.videoHeight

        if (aspectRatio > maxWidth / maxHeight) {
          canvas.width = maxWidth
          canvas.height = maxWidth / aspectRatio
        } else {
          canvas.height = maxHeight
          canvas.width = maxHeight * aspectRatio
        }

        const ctx = canvas.getContext('2d', { alpha: false })

        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.6)
          resolve(thumbnailUrl)
        } else {
          resolve(null)
        }
      } catch (error) {
        console.error('Error generating video thumbnail:', error)
        resolve(null)
      } finally {
        video.src = ''
        video.load()
      }
    }

    video.onerror = () => {
      clearTimeout(timeout)
      resolve(null)
    }

    video.src = videoUrl
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
