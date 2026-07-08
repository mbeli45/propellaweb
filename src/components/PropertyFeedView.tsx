import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useThemeMode } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/I18nContext'
import { getColors } from '@/constants/Colors'
import { PropertyData } from './PropertyCard'
import { formatPrice, calculateRentPrices } from '@/utils/shareUtils'
import { isVideoUrl, separateMedia } from '@/utils/videoUtils'
import { MapPin, BedDouble, Bath, Share2, Eye, ChevronUp, ChevronDown, LayoutGrid, Grid3x3, Search, X } from 'lucide-react'
import './PropertyFeedView.css'

const RENDER_WINDOW = 2 // Only render properties within ±2 of current index

interface PropertyFeedViewProps {
  properties: PropertyData[]
  loading?: boolean
  onLoadMore?: () => void
  hasMore?: boolean
  onSwitchToGrid?: () => void
  onSearch?: (query: string) => void
  searchValue?: string
}

export default function PropertyFeedView({
  properties,
  loading = false,
  onLoadMore,
  hasMore = false,
  onSwitchToGrid,
  onSearch,
  searchValue = ''
}: PropertyFeedViewProps) {
  const { colorScheme } = useThemeMode()
  const { t } = useLanguage()
  const Colors = getColors(colorScheme)
  const navigate = useNavigate()
  
  const [currentPropertyIndex, setCurrentPropertyIndex] = useState(0)
  const [currentMediaIndex, setCurrentMediaIndex] = useState<{ [propertyId: string]: number }>({})
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())
  const [feedSearchQuery, setFeedSearchQuery] = useState(searchValue)
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({})
  const touchStartX = useRef<number>(0)
  const touchStartY = useRef<number>(0)
  const touchEndX = useRef<number>(0)
  const touchEndY = useRef<number>(0)
  const isTransitioning = useRef<boolean>(false)
  const isDragging = useRef<boolean>(false)
  const wheelTimeout = useRef<NodeJS.Timeout | null>(null)

  // Sync search query with prop
  useEffect(() => {
    setFeedSearchQuery(searchValue)
  }, [searchValue])

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setFeedSearchQuery(query)
    if (onSearch) {
      onSearch(query)
    }
  }

  // Handle clear search
  const handleClearSearch = () => {
    setFeedSearchQuery('')
    if (onSearch) {
      onSearch('')
    }
  }

  // Get media for a property (videos first, then images)
  const getPropertyMedia = useCallback((property: PropertyData) => {
    const allMedia = property.images || []
    if (property.image && !allMedia.includes(property.image)) {
      allMedia.unshift(property.image)
    }
    const { videos, images } = separateMedia(allMedia)
    return [...videos, ...images]
  }, [])

  // Get current property and its media
  const currentProperty = properties[currentPropertyIndex]
  const currentPropertyMedia = currentProperty ? getPropertyMedia(currentProperty) : []
  const currentMediaIdx = currentProperty ? (currentMediaIndex[currentProperty.id] || 0) : 0
  const currentMediaUrl = currentPropertyMedia[currentMediaIdx] || currentProperty?.image || '/placeholder-property.jpg'
  const isCurrentVideo = isVideoUrl(currentMediaUrl)

  // Navigate to next property (vertical - swipe up)
  const goToNextProperty = useCallback(() => {
    if (isTransitioning.current || currentPropertyIndex >= properties.length - 1) {
      // Load more when at the end
      if (hasMore && onLoadMore && currentPropertyIndex >= properties.length - 2) {
        onLoadMore()
      }
      return
    }
    
    isTransitioning.current = true
    
    // Pause current video
    if (currentProperty && isCurrentVideo) {
      const video = videoRefs.current[`${currentProperty.id}-${currentMediaUrl}`]
      if (video) {
        video.pause()
      }
    }
    
    setCurrentPropertyIndex(prev => prev + 1)
    
    setTimeout(() => {
      isTransitioning.current = false
    }, 300)
  }, [currentPropertyIndex, properties.length, hasMore, onLoadMore, currentProperty, isCurrentVideo, currentMediaUrl])

  // Navigate to previous property (vertical - swipe down)
  const goToPreviousProperty = useCallback(() => {
    if (isTransitioning.current || currentPropertyIndex <= 0) return
    
    isTransitioning.current = true
    
    // Pause current video
    if (currentProperty && isCurrentVideo) {
      const video = videoRefs.current[`${currentProperty.id}-${currentMediaUrl}`]
      if (video) {
        video.pause()
      }
    }
    
    setCurrentPropertyIndex(prev => prev - 1)
    
    setTimeout(() => {
      isTransitioning.current = false
    }, 300)
  }, [currentPropertyIndex, currentProperty, isCurrentVideo, currentMediaUrl])

  // Navigate to next media in same property (horizontal - swipe left)
  const goToNextMedia = useCallback(() => {
    if (!currentProperty) return
    
    // Allow navigation even if transitioning to prevent blocking
    if (isTransitioning.current) {
      setTimeout(() => goToNextMedia(), 50)
      return
    }
    
    const media = getPropertyMedia(currentProperty)
    const currentIdx = currentMediaIndex[currentProperty.id] || 0
    
    if (currentIdx >= media.length - 1) return
    
    isTransitioning.current = true
    
    // Pause current video
    if (isCurrentVideo) {
      const video = videoRefs.current[`${currentProperty.id}-${currentMediaUrl}`]
      if (video) {
        video.pause()
      }
    }
    
    setCurrentMediaIndex(prev => ({
      ...prev,
      [currentProperty.id]: currentIdx + 1
    }))
    
    setTimeout(() => {
      isTransitioning.current = false
    }, 300)
  }, [currentProperty, currentMediaIndex, getPropertyMedia, isCurrentVideo, currentMediaUrl])

  // Navigate to previous media in same property (horizontal - swipe right)
  const goToPreviousMedia = useCallback(() => {
    if (!currentProperty || isTransitioning.current) return
    
    const currentIdx = currentMediaIndex[currentProperty.id] || 0
    
    if (currentIdx <= 0) return
    
    isTransitioning.current = true
    
    // Pause current video
    if (isCurrentVideo) {
      const video = videoRefs.current[`${currentProperty.id}-${currentMediaUrl}`]
      if (video) {
        video.pause()
      }
    }
    
    setCurrentMediaIndex(prev => ({
      ...prev,
      [currentProperty.id]: currentIdx - 1
    }))
    
    setTimeout(() => {
      isTransitioning.current = false
    }, 300)
  }, [currentProperty, currentMediaIndex, isCurrentVideo, currentMediaUrl])

  // Touch handlers for 2D swipe detection
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    touchEndX.current = e.touches[0].clientX
    touchEndY.current = e.touches[0].clientY
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX
    touchEndY.current = e.touches[0].clientY
  }

  const handleTouchEnd = () => {
    handleSwipeEnd()
  }

  // Mouse handlers for desktop drag support
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true
    touchStartX.current = e.clientX
    touchStartY.current = e.clientY
    touchEndX.current = e.clientX
    touchEndY.current = e.clientY
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return
    touchEndX.current = e.clientX
    touchEndY.current = e.clientY
  }

  const handleMouseUp = () => {
    if (!isDragging.current) return
    isDragging.current = false
    handleSwipeEnd()
  }

  const handleMouseLeave = () => {
    if (!isDragging.current) return
    isDragging.current = false
  }

  const handleSwipeEnd = () => {
    if (!containerRef.current) return

    const diffX = touchStartX.current - touchEndX.current
    const diffY = touchStartY.current - touchEndY.current
    const threshold = 50 // Threshold for swipe detection

    // Determine if horizontal or vertical swipe is dominant
    const absDiffX = Math.abs(diffX)
    const absDiffY = Math.abs(diffY)

    const hasMultipleMedia = currentPropertyMedia.length > 1

    if (hasMultipleMedia && absDiffX > threshold && absDiffX > absDiffY) {
      if (diffX > 0) {
        goToNextMedia()
      } else {
        goToPreviousMedia()
      }
    } else if (absDiffY > threshold && absDiffY > absDiffX) {
      if (diffY > 0) {
        goToNextProperty()
      } else {
        goToPreviousProperty()
      }
    }
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const hasMultipleMedia = currentPropertyMedia.length > 1
      
      if (e.key === 'ArrowLeft' && hasMultipleMedia) {
        e.preventDefault()
        goToPreviousMedia()
      } else if (e.key === 'ArrowRight' && hasMultipleMedia) {
        e.preventDefault()
        goToNextMedia()
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        goToNextProperty()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        goToPreviousProperty()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [goToNextMedia, goToPreviousMedia, goToNextProperty, goToPreviousProperty, currentPropertyMedia.length])

  // Mouse wheel scroll support (YouTube-style)
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (!containerRef.current) return
      
      const container = containerRef.current
      
      // Check if mouse is over the container
      const rect = container.getBoundingClientRect()
      const isOverContainer = (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      )
      
      if (!isOverContainer) return
      
      // Only handle vertical scrolling with sufficient delta
      const absDeltaY = Math.abs(e.deltaY)
      const absDeltaX = Math.abs(e.deltaX)
      
      if (absDeltaY > absDeltaX && absDeltaY > 10) {
        e.preventDefault()
        e.stopPropagation()
        
        // Prevent rapid scrolling
        if (isTransitioning.current) return
        
        // Clear any pending wheel action
        if (wheelTimeout.current) {
          clearTimeout(wheelTimeout.current)
        }
        
        // Debounce wheel events to prevent rapid scrolling
        wheelTimeout.current = setTimeout(() => {
          // Scroll down (positive deltaY) = next property
          // Scroll up (negative deltaY) = previous property
          if (e.deltaY > 0) {
            goToNextProperty()
          } else if (e.deltaY < 0) {
            goToPreviousProperty()
          }
        }, 100)
      }
    }

    // Attach to window to capture all wheel events when over the container
    window.addEventListener('wheel', handleWheel, { passive: false })
    
    return () => {
      window.removeEventListener('wheel', handleWheel)
      if (wheelTimeout.current) {
        clearTimeout(wheelTimeout.current)
      }
    }
  }, [goToNextProperty, goToPreviousProperty])

  // Auto-play video when media becomes active (TikTok-style)
  useEffect(() => {
    if (!currentProperty || !isCurrentVideo) {
      // If current media is not a video, pause all videos
      Object.values(videoRefs.current).forEach(video => {
        if (video) {
          video.pause()
          video.currentTime = 0
        }
      })
      return
    }

    const videoKey = `${currentProperty.id}-${currentMediaUrl}`
    const video = videoRefs.current[videoKey]
    
    if (video) {
      // Ensure video is ready and play immediately
      const playVideo = async () => {
        try {
          // Reset video to start
          video.currentTime = 0
          
          // Ensure video is loaded
          if (video.readyState < 2) {
            video.load()
            await new Promise((resolve) => {
              video.oncanplay = resolve
            })
          }
          
          // Play video
          await video.play()
        } catch (err) {
          console.log('Video autoplay prevented:', err)
          // Try again after a short delay
          setTimeout(() => {
            video.play().catch(() => {})
          }, 200)
        }
      }
      
      playVideo()
    }

    // Pause videos from other properties
    properties.forEach((prop, propIndex) => {
      if (propIndex !== currentPropertyIndex) {
        const propMedia = getPropertyMedia(prop)
        propMedia.forEach(media => {
          if (isVideoUrl(media)) {
            const videoKey = `${prop.id}-${media}`
            const video = videoRefs.current[videoKey]
            if (video) {
              video.pause()
              video.currentTime = 0
            }
          }
        })
      }
    })

    // Pause other media from same property
    if (currentProperty) {
      const allMedia = getPropertyMedia(currentProperty)
      allMedia.forEach((media, idx) => {
        if (idx !== currentMediaIdx && isVideoUrl(media)) {
          const videoKey = `${currentProperty.id}-${media}`
          const video = videoRefs.current[videoKey]
          if (video) {
            video.pause()
            video.currentTime = 0
          }
        }
      })
    }
  }, [currentPropertyIndex, currentMediaIdx, currentProperty, isCurrentVideo, currentMediaUrl, properties, getPropertyMedia])

  // Reset media index when property changes
  useEffect(() => {
    if (currentProperty && currentMediaIndex[currentProperty.id] === undefined) {
      setCurrentMediaIndex(prev => ({
        ...prev,
        [currentProperty.id]: 0
      }))
    }
  }, [currentPropertyIndex, currentProperty])

  // Preload first image of adjacent properties
  useEffect(() => {
    const nextProp = properties[currentPropertyIndex + 1]
    if (nextProp) {
      const nextMedia = getPropertyMedia(nextProp)
      const firstImage = nextMedia.find(m => !isVideoUrl(m))
      if (firstImage) {
        const img = new Image()
        img.src = firstImage
      }
    }
    const prevProp = properties[currentPropertyIndex - 1]
    if (prevProp) {
      const prevMedia = getPropertyMedia(prevProp)
      const firstImage = prevMedia.find(m => !isVideoUrl(m))
      if (firstImage) {
        const img = new Image()
        img.src = firstImage
      }
    }
  }, [currentPropertyIndex, properties, getPropertyMedia])

  if (properties.length === 0 && !loading) {
    return (
      <div className="feed-empty-state" style={{ color: Colors.neutral[600] }}>
        <p>{t('home.noPropertiesAvailable')}</p>
      </div>
    )
  }

  return (
    <div 
      className="property-feed-container"
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      style={{ backgroundColor: Colors.neutral[900] }}
    >
      {/* Search Overlay - Top Left */}
      {onSearch && (
        <div style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          right: '100px',
          maxWidth: '400px',
          zIndex: 9998,
          pointerEvents: 'auto'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.55)',
            borderRadius: '22px',
            border: '1px solid rgba(255,255,255,0.3)',
            paddingLeft: '12px',
            paddingRight: '12px',
            height: '44px',
            backdropFilter: 'blur(10px)'
          }}>
            <Search size={18} color="rgba(255,255,255,0.9)" />
            <input
              type="text"
              value={feedSearchQuery}
              onChange={handleSearchChange}
              placeholder={t('home.searchPlaceholder') || 'Search properties...'}
              style={{
                flex: 1,
                marginLeft: '8px',
                backgroundColor: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#fff',
                fontSize: '15px',
                fontFamily: 'Inter-Medium',
                padding: 0
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
            />
            {feedSearchQuery.length > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); handleClearSearch() }}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                style={{
                  marginLeft: '8px',
                  padding: '4px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={16} color="rgba(255,255,255,0.9)" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Grid toggle — matches mobile actionButton style: circle + label below */}
      {onSwitchToGrid && (
        <button
          onClick={(e) => { e.stopPropagation(); onSwitchToGrid() }}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: '16px',
            right: '12px',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            pointerEvents: 'auto'
          }}
          title="Switch to Grid View"
        >
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: Colors.primary[600],
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
          }}>
            <Grid3x3 size={24} color="#fff" />
          </div>
          <span style={{ fontSize: '11px', color: '#fff', fontWeight: '600', textShadow: '0 2px 6px rgba(0,0,0,0.9)' }}>
            Grid
          </span>
        </button>
      )}

      {/* Vertical Swiping Container - Properties */}
      <div className="feed-properties-wrapper" style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transform: `translateY(-${currentPropertyIndex * 100}%)`,
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        {properties.map((property, propIndex) => {
          const isInWindow = Math.abs(propIndex - currentPropertyIndex) <= RENDER_WINDOW
          const isActive = propIndex === currentPropertyIndex
          const media = getPropertyMedia(property)
          const mediaIdx = currentMediaIndex[property.id] || 0
          const mediaUrl = media[mediaIdx] || property.image || '/placeholder-property.jpg'
          const isVideo = isVideoUrl(mediaUrl)

          if (!isInWindow) {
            return (
              <div
                key={property.id}
                style={{ width: '100%', height: '100dvh', flexShrink: 0, backgroundColor: '#000' }}
              />
            )
          }

          return (
            <div
              key={property.id}
              className="feed-property-item"
              style={{
                width: '100%',
                height: '100dvh',
                flexShrink: 0,
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Horizontal Swiping Container - Media within property */}
              <div className="feed-media-wrapper" style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                transform: `translateX(-${mediaIdx * 100}%)`,
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}>
                {media.map((mediaItem, mediaItemIndex) => {
                  const isMediaVideo = isVideoUrl(mediaItem)
                  const isCurrentMediaItem = isActive && mediaItemIndex === mediaIdx

                  return (
                    <div
                      key={`${property.id}-media-${mediaItemIndex}`}
                      className="feed-media-item"
                      style={{
                        width: '100%',
                        height: '100dvh',
                        flexShrink: 0,
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      {isMediaVideo ? (
                        <video
                          ref={(el) => {
                            if (el) {
                              videoRefs.current[`${property.id}-${mediaItem}`] = el
                            }
                          }}
                          src={mediaItem}
                          className="feed-video"
                          playsInline
                          muted
                          loop
                          autoPlay
                          preload="auto"
                          onLoadedData={(e) => {
                            if (propIndex === currentPropertyIndex && mediaItemIndex === mediaIdx) {
                              const video = e.currentTarget
                              video.play().catch(() => {
                                setTimeout(() => video.play().catch(() => {}), 100)
                              })
                            }
                          }}
                          onPlay={() => {
                            if (propIndex === currentPropertyIndex && mediaItemIndex === mediaIdx) {
                              const video = videoRefs.current[`${property.id}-${mediaItem}`]
                              if (video && video.paused) {
                                video.play().catch(() => {})
                              }
                            }
                          }}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                      ) : (() => {
                        const imgKey = `${property.id}-${mediaItem}`
                        const isImgLoaded = loadedImages.has(imgKey)
                        return (
                          <>
                            {!isImgLoaded && (
                              <div style={{
                                position: 'absolute',
                                inset: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#111'
                              }}>
                                <div className="feed-spinner" />
                              </div>
                            )}
                            <img
                              src={mediaItem}
                              alt={property.title || 'Property'}
                              fetchPriority={isCurrentMediaItem ? 'high' : 'auto'}
                              decoding="async"
                              onLoad={() => setLoadedImages(prev => {
                                const next = new Set(prev)
                                next.add(imgKey)
                                return next
                              })}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                display: 'block',
                                opacity: isImgLoaded ? 1 : 0,
                                transition: 'opacity 0.3s ease'
                              }}
                            />
                          </>
                        )
                      })()}

                      {/* Gradient Overlay */}
                      <div 
                        className="feed-gradient-overlay"
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: '60%',
                          background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 50%, transparent 100%)',
                          pointerEvents: 'none'
                        }}
                      />
                    </div>
                  )
                })}
              </div>

              {/* Media Progress Indicators - Show dots for multiple media */}
              {propIndex === currentPropertyIndex && media.length > 1 && (
                <div style={{
                  position: 'absolute',
                  top: '16px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 15,
                  display: 'flex',
                  gap: '6px',
                  padding: '8px 12px',
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  borderRadius: '20px',
                  backdropFilter: 'blur(10px)'
                }}>
                  {media.map((_, idx) => (
                    <div
                      key={idx}
                      style={{
                        width: idx === mediaIdx ? '24px' : '6px',
                        height: '3px',
                        borderRadius: '2px',
                        backgroundColor: idx === mediaIdx ? Colors.white : 'rgba(255,255,255,0.4)',
                        transition: 'all 0.3s ease'
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Navigation Arrows for Large Screens - Only show when multiple media */}
              {propIndex === currentPropertyIndex && media.length > 1 && (
                <>
                  {/* Left Arrow */}
                  {mediaIdx > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        goToPreviousMedia()
                      }}
                      style={{
                        position: 'absolute',
                        left: '20px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 15,
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'none',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backdropFilter: 'blur(10px)',
                        transition: 'all 0.2s ease'
                      }}
                      className="feed-nav-arrow"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.7)'
                        e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.5)'
                        e.currentTarget.style.transform = 'translateY(-50%) scale(1)'
                      }}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6"></polyline>
                      </svg>
                    </button>
                  )}

                  {/* Right Arrow */}
                  {mediaIdx < media.length - 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        goToNextMedia()
                      }}
                      style={{
                        position: 'absolute',
                        right: '20px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 15,
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'none',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backdropFilter: 'blur(10px)',
                        transition: 'all 0.2s ease'
                      }}
                      className="feed-nav-arrow"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.7)'
                        e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.5)'
                        e.currentTarget.style.transform = 'translateY(-50%) scale(1)'
                      }}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                    </button>
                  )}
                </>
              )}

              {/* Property overlay — only rendered for the active slide */}
              {propIndex === currentPropertyIndex && (
                <>
                  {/* Caption: bottom-left, right: 80px leaves room for action buttons */}
                  <div
                    className="feed-content-static"
                    key={`property-overlay-${property.id}`}
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: '80px',
                      zIndex: 10,
                      paddingLeft: '16px',
                      paddingRight: '16px',
                      paddingBottom: '70px',
                      pointerEvents: 'auto'
                    }}
                  >
                    {/* Swipe Up hint on first property */}
                    {propIndex === 0 && (
                      <div style={{
                        position: 'absolute',
                        top: '-60px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px',
                        animation: 'pulse 2s ease-in-out infinite'
                      }}>
                        <span style={{
                          fontSize: '12px',
                          color: '#fff',
                          fontWeight: '600',
                          textShadow: '0 2px 6px rgba(0,0,0,0.9)',
                          textTransform: 'uppercase',
                          letterSpacing: '1px'
                        }}>
                          Swipe Up
                        </span>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </div>
                    )}

                    {/* Property info — 8px gap between rows, matching mobile */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <h2 style={{
                        fontSize: '16px',
                        fontWeight: '700',
                        color: '#fff',
                        margin: 0,
                        textShadow: '0 2px 6px rgba(0,0,0,0.9)',
                        lineHeight: '1.375'
                      }}>
                        {property.title || t('property.untitledProperty')}
                      </h2>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={14} color="#fff" />
                        <span style={{ fontSize: '14px', color: '#fff', textShadow: '0 2px 6px rgba(0,0,0,0.9)' }}>
                          {property.location || t('property.locationNotSpecified')}
                        </span>
                      </div>

                      {(property.bedrooms || property.bathrooms || property.area) && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {property.bedrooms && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <BedDouble size={14} color="#fff" />
                              <span style={{ fontSize: '13px', color: '#fff', textShadow: '0 2px 6px rgba(0,0,0,0.9)' }}>
                                {property.bedrooms}
                              </span>
                            </div>
                          )}
                          {property.bathrooms && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Bath size={14} color="#fff" />
                              <span style={{ fontSize: '13px', color: '#fff', textShadow: '0 2px 6px rgba(0,0,0,0.9)' }}>
                                {property.bathrooms}
                              </span>
                            </div>
                          )}
                          {property.area && (
                            <span style={{ fontSize: '13px', color: '#fff', textShadow: '0 2px 6px rgba(0,0,0,0.9)' }}>
                              {property.area} m²
                            </span>
                          )}
                        </div>
                      )}

                      {property.type === 'rent' ? (() => {
                        const { monthlyPrice } = calculateRentPrices(property.price, property.rent_period)
                        return (
                          <span style={{ fontSize: '18px', fontWeight: '700', color: '#fff', textShadow: '0 2px 6px rgba(0,0,0,0.9)' }}>
                            {formatPrice(monthlyPrice)} / {t('propertyCard.month')}
                          </span>
                        )
                      })() : (
                        <span style={{ fontSize: '18px', fontWeight: '700', color: '#fff', textShadow: '0 2px 6px rgba(0,0,0,0.9)' }}>
                          {formatPrice(property.price)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right-side action buttons — TikTok style, matching mobile */}
                  <div style={{
                    position: 'absolute',
                    right: '12px',
                    bottom: '160px',
                    zIndex: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '20px'
                  }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/property/${property.id}`) }}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(50,50,50,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Eye size={24} color="#fff" />
                      </div>
                      <span style={{ fontSize: '11px', color: '#fff', fontWeight: '600', textShadow: '0 2px 6px rgba(0,0,0,0.9)' }}>
                        View
                      </span>
                    </button>

                    <button
                      onClick={(e) => { e.stopPropagation() }}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(50,50,50,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Share2 size={24} color="#fff" />
                      </div>
                      <span style={{ fontSize: '11px', color: '#fff', fontWeight: '600', textShadow: '0 2px 6px rgba(0,0,0,0.9)' }}>
                        Share
                      </span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* Vertical Navigation Arrows for Large Screens - Property Navigation */}
      <div className="feed-property-nav-arrows">
        {/* Up Arrow - Previous Property */}
        {currentPropertyIndex > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              goToPreviousProperty()
            }}
            style={{
              position: 'absolute',
              top: '30%',
              left: '20px',
              transform: 'translateY(-50%)',
              zIndex: 20,
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'rgba(0,0,0,0.5)',
              border: 'none',
              cursor: 'pointer',
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.2s ease'
            }}
            className="feed-property-nav-arrow"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.7)'
              e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.5)'
              e.currentTarget.style.transform = 'translateY(-50%) scale(1)'
            }}
            title="Previous Property"
          >
            <ChevronUp size={24} color="white" strokeWidth={2.5} />
          </button>
        )}

        {/* Down Arrow - Next Property */}
        {currentPropertyIndex < properties.length - 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              goToNextProperty()
            }}
            style={{
              position: 'absolute',
              bottom: '30%',
              left: '20px',
              transform: 'translateY(50%)',
              zIndex: 20,
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'rgba(0,0,0,0.5)',
              border: 'none',
              cursor: 'pointer',
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.2s ease'
            }}
            className="feed-property-nav-arrow"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.7)'
              e.currentTarget.style.transform = 'translateY(50%) scale(1.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.5)'
              e.currentTarget.style.transform = 'translateY(50%) scale(1)'
            }}
            title="Next Property"
          >
            <ChevronDown size={24} color="white" strokeWidth={2.5} />
          </button>
        )}
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="feed-loading" style={{ color: Colors.white }}>
          <p>{t('common.loading')}...</p>
        </div>
      )}
    </div>
  )
}
