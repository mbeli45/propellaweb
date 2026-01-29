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
 * Generates a thumbnail from a video URL
 * Returns a promise that resolves to a data URL or the original URL if generation fails
 */
export function generateVideoThumbnail(videoUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    video.crossOrigin = 'anonymous'
    video.preload = 'metadata'
    
    video.onloadedmetadata = () => {
      video.currentTime = 1 // Seek to 1 second
    }
    
    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8)
          resolve(thumbnailUrl)
        } else {
          resolve(videoUrl) // Fallback to video URL
        }
      } catch (error) {
        console.error('Error generating video thumbnail:', error)
        resolve(videoUrl) // Fallback to video URL
      }
    }
    
    video.onerror = () => {
      resolve(videoUrl) // Fallback to video URL on error
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
