import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { generateVideoThumbnail } from '@/utils/videoUtils'

/** Generate previews only while visible; cancel reads as soon as a card leaves view. */
export default function VideoThumbnail({ src, alt, className, style }: {
  src: string
  alt: string
  className?: string
  style?: CSSProperties
}) {
  const imageRef = useRef<HTMLImageElement>(null)
  const [preview, setPreview] = useState<{ source: string; image: string } | null>(null)
  useEffect(() => {
    const element = imageRef.current
    if (!element) return
    let disposed = false
    let controller: AbortController | undefined
    let completed = false
    const load = () => {
      if (completed || controller) return
      const request = new AbortController()
      controller = request
      generateVideoThumbnail(src, request.signal).then((image) => {
        if (disposed || request.signal.aborted) return
        controller = undefined
        completed = true
        if (image) setPreview({ source: src, image })
      })
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) load()
      else {
        controller?.abort()
        controller = undefined
      }
    }, { threshold: 0.05 })
    observer.observe(element)
    return () => {
      disposed = true
      observer.disconnect()
      controller?.abort()
    }
  }, [src])
  return <img ref={imageRef} src={preview?.source === src ? preview.image : '/property-video-placeholder.svg'}
    alt={alt} className={className} style={style} decoding="async" />
}
