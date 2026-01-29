import React, { useState, useRef, useEffect } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize, X } from 'lucide-react'
import { useThemeMode } from '@/contexts/ThemeContext'
import { getColors } from '@/constants/Colors'
import './VideoPlayer.css'

interface VideoPlayerProps {
  src: string
  thumbnail?: string
  autoPlay?: boolean
  controls?: boolean
  className?: string
  onClose?: () => void
}

export default function VideoPlayer({
  src,
  thumbnail,
  autoPlay = false,
  controls = true,
  className = '',
  onClose,
}: VideoPlayerProps) {
  const { colorScheme } = useThemeMode()
  const Colors = getColors(colorScheme)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    // Detect mobile device
    const checkMobile = () => {
      setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showThumbnail, setShowThumbnail] = useState(!!thumbnail && !autoPlay)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const updateTime = () => setCurrentTime(video.currentTime)
    const updateDuration = () => setDuration(video.duration)
    const handlePlay = () => {
      setIsPlaying(true)
      setShowThumbnail(false)
    }
    const handlePause = () => setIsPlaying(false)
    const handleEnded = () => setIsPlaying(false)

    video.addEventListener('timeupdate', updateTime)
    video.addEventListener('loadedmetadata', updateDuration)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('ended', handleEnded)

    if (autoPlay) {
      video.play().catch(console.error)
    }

    return () => {
      video.removeEventListener('timeupdate', updateTime)
      video.removeEventListener('loadedmetadata', updateDuration)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('ended', handleEnded)
    }
  }, [autoPlay])

  useEffect(() => {
    if (isFullscreen) {
      const video = videoRef.current
      if (video?.requestFullscreen) {
        video.requestFullscreen().catch(console.error)
      }
    }
  }, [isFullscreen])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return

    if (isPlaying) {
      video.pause()
    } else {
      video.play().catch(console.error)
    }
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return
    video.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current
    if (!video) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percent = x / rect.width
    video.currentTime = percent * duration
  }

  const handleMouseMove = () => {
    setShowControls(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false)
      }
    }, 3000)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div
      className={`video-player-container ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        backgroundColor: Colors.neutral[900],
        borderRadius: '0',
        overflow: 'hidden',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        if (isPlaying) {
          setShowControls(false)
        }
      }}
      onTouchStart={() => {
        // On mobile, always show controls on touch
        setShowControls(true)
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current)
        }
        controlsTimeoutRef.current = setTimeout(() => {
          if (isPlaying) {
            setShowControls(false)
          }
        }, 3000)
      }}
    >
      <video
        ref={videoRef}
        src={src}
        className="video-player"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
        }}
        playsInline
        controls={false}
        onClick={(e) => {
          // On mobile, clicking video toggles play/pause
          e.preventDefault()
          togglePlay()
        }}
      />

      {showThumbnail && thumbnail && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url(${thumbnail})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
          onClick={() => {
            setShowThumbnail(false)
            videoRef.current?.play().catch(console.error)
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            <Play size={32} color="#FFFFFF" fill="#FFFFFF" />
          </div>
        </div>
      )}

      {controls && (
        <div
          className={`video-controls ${showControls || !isPlaying || isMobile ? 'visible' : 'hidden'}`}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            transition: 'opacity 0.3s',
            opacity: showControls || !isPlaying || isMobile ? 1 : 0,
            pointerEvents: 'auto',
            zIndex: 10,
          }}
        >
          {/* Progress Bar */}
          <div
            style={{
              width: '100%',
              height: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
              borderRadius: '0',
              cursor: 'pointer',
              position: 'relative',
              touchAction: 'manipulation',
            }}
            onClick={handleSeek}
            onTouchStart={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const touch = e.touches[0]
              const x = touch.clientX - rect.left
              const percent = x / rect.width
              const video = videoRef.current
              if (video) {
                video.currentTime = percent * duration
              }
            }}
          >
            <div
              style={{
                width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                height: '100%',
                backgroundColor: Colors.primary[600],
                borderRadius: '0',
              }}
            />
          </div>

          {/* Controls Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                togglePlay()
              }}
              onTouchStart={(e) => {
                e.preventDefault()
                e.stopPropagation()
                togglePlay()
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px',
                color: '#FFFFFF',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} fill="#FFFFFF" />}
            </button>

            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                toggleMute()
              }}
              onTouchStart={(e) => {
                e.preventDefault()
                e.stopPropagation()
                toggleMute()
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px',
                color: '#FFFFFF',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>

            <div
              style={{
                flex: 1,
                color: '#FFFFFF',
                fontSize: '12px',
                fontFamily: 'monospace',
              }}
            >
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>

            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                const video = videoRef.current
                if (video?.requestFullscreen) {
                  video.requestFullscreen().catch(console.error)
                }
              }}
              onTouchStart={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px',
                color: '#FFFFFF',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <Maximize size={20} />
            </button>

            {onClose && (
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onClose()
                }}
                onTouchStart={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '8px',
                  color: '#FFFFFF',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
