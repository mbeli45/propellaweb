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
    video.muted = true // Mute to avoid audio playback
    
    // Set timeout to prevent hanging
    const timeout = setTimeout(() => {
      resolve(videoUrl) // Fallback after 5 seconds
    }, 5000)
    
    video.onloadedmetadata = () => {
      // Seek to 1 second or 10% of video duration, whichever is smaller
      const seekTime = Math.min(1, video.duration * 0.1)
      video.currentTime = seekTime
    }
    
    video.onseeked = () => {
      clearTimeout(timeout)
      try {
        const canvas = document.createElement('canvas')
        // Use smaller dimensions for faster processing
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
          // Use lower quality for faster generation
          const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.6)
          resolve(thumbnailUrl)
        } else {
          resolve(videoUrl) // Fallback to video URL
        }
      } catch (error) {
        console.error('Error generating video thumbnail:', error)
        resolve(videoUrl) // Fallback to video URL
      } finally {
        // Clean up
        video.src = ''
        video.load()
      }
    }
    
    video.onerror = () => {
      clearTimeout(timeout)
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
