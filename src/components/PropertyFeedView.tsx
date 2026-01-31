import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useThemeMode } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/I18nContext'
import { getColors } from '@/constants/Colors'
import { PropertyData } from './PropertyCard'
import { formatPrice, calculateRentPrices } from '@/utils/shareUtils'
import { isVideoUrl, separateMedia } from '@/utils/videoUtils'
import { MapPin, BedDouble, Bath, Share2 } from 'lucide-react'
import './PropertyFeedView.css'

interface PropertyFeedViewProps {
  properties: PropertyData[]
  loading?: boolean
  onLoadMore?: () => void
  hasMore?: boolean
}

export default function PropertyFeedView({ 
  properties, 
  loading = false,
  onLoadMore,
  hasMore = false
}: PropertyFeedViewProps) {
  const { colorScheme } = useThemeMode()
  const { t } = useLanguage()
  const Colors = getColors(colorScheme)
  const navigate = useNavigate()
  
  const [currentPropertyIndex, setCurrentPropertyIndex] = useState(0)
  const [currentMediaIndex, setCurrentMediaIndex] = useState<{ [propertyId: string]: number }>({})
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({})
  const touchStartX = useRef<number>(0)
  const touchStartY = useRef<number>(0)
  const touchEndX = useRef<number>(0)
  const touchEndY = useRef<number>(0)
  const isTransitioning = useRef<boolean>(false)
  const isDragging = useRef<boolean>(false)

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
    console.log('Touch start:', e.touches[0].clientX, e.touches[0].clientY)
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
    console.log('Touch end - Start:', touchStartX.current, touchStartY.current, 'End:', touchEndX.current, touchEndY.current)
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

    console.log('Swipe detected - diffX:', diffX, 'diffY:', diffY, 'absDiffX:', absDiffX, 'absDiffY:', absDiffY)

    // Check if we have multiple media for current property
    const hasMultipleMedia = currentPropertyMedia.length > 1
    console.log('Has multiple media:', hasMultipleMedia, 'Count:', currentPropertyMedia.length)

    // Prioritize horizontal swipe when there are multiple media
    if (hasMultipleMedia && absDiffX > threshold && absDiffX > absDiffY) {
      console.log('Horizontal swipe detected')
      // Horizontal swipe - navigate media within property
      if (diffX > 0) {
        console.log('Next media')
        // Swipe left (startX > endX) - next media
        goToNextMedia()
      } else {
        console.log('Previous media')
        // Swipe right (startX < endX) - previous media
        goToPreviousMedia()
      }
    } else if (absDiffY > threshold && absDiffY > absDiffX) {
      console.log('Vertical swipe detected')
      // Vertical swipe - navigate between properties
      if (diffY > 0) {
        console.log('Next property')
        // Swipe up (startY > endY) - next property
        goToNextProperty()
      } else {
        console.log('Previous property')
        // Swipe down (startY < endY) - previous property
        goToPreviousProperty()
      }
    } else {
      console.log('No swipe detected - threshold not met or no clear direction')
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
          const media = getPropertyMedia(property)
          const mediaIdx = currentMediaIndex[property.id] || 0
          const mediaUrl = media[mediaIdx] || property.image || '/placeholder-property.jpg'
          const isVideo = isVideoUrl(mediaUrl)
          
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
                            // Auto-play when video is loaded and is the current one
                            if (propIndex === currentPropertyIndex && mediaItemIndex === mediaIdx) {
                              const video = e.currentTarget
                              video.play().catch(() => {
                                // Retry if autoplay fails
                                setTimeout(() => video.play().catch(() => {}), 100)
                              })
                            }
                          }}
                          onPlay={() => {
                            // Ensure video stays playing when it becomes active
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
                      ) : (
                        <div
                          className="feed-image"
                          style={{
                            width: '100%',
                            height: '100%',
                            backgroundImage: `url(${mediaItem})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                          }}
                        />
                      )}

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
                        height: '6px',
                        borderRadius: '3px',
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

              {/* Property Content Overlay - Moves with property vertically, static during horizontal media swipe */}
              {propIndex === currentPropertyIndex && (
                <div 
                  className="feed-content-static"
                  key={`property-overlay-${property.id}`}
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    zIndex: 10,
                    padding: '16px',
                    paddingBottom: '70px',
                    pointerEvents: 'auto',
                    transform: 'none',
                    willChange: 'auto'
                  }}
                >
                  {/* Scroll Down Indicator - Only show on first property */}
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
                        color: Colors.white,
                        fontWeight: '600',
                        textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                      }}>
                        Swipe Up
                      </span>
                      <svg 
                        width="24" 
                        height="24" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="white" 
                        strokeWidth="3" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        style={{
                          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))'
                        }}
                      >
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </div>
                  )}
                  {/* Property Info */}
                  <div style={{ marginBottom: '16px' }}>
                    <h2 style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: Colors.white,
                      marginBottom: '6px',
                      textShadow: '0 2px 8px rgba(0,0,0,0.5)',
                      lineHeight: '1.3'
                    }}>
                      {property.title || t('property.untitledProperty')}
                    </h2>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                      <MapPin size={14} color={Colors.white} />
                      <span style={{
                        fontSize: '13px',
                        color: Colors.white,
                        textShadow: '0 1px 4px rgba(0,0,0,0.5)'
                      }}>
                        {property.location || t('property.locationNotSpecified')}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      {property.bedrooms && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <BedDouble size={14} color={Colors.white} />
                          <span style={{ fontSize: '13px', color: Colors.white, textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
                            {property.bedrooms}
                          </span>
                        </div>
                      )}
                      {property.bathrooms && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Bath size={14} color={Colors.white} />
                          <span style={{ fontSize: '13px', color: Colors.white, textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
                            {property.bathrooms}
                          </span>
                        </div>
                      )}
                      {property.area && (
                        <span style={{ fontSize: '13px', color: Colors.white, textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
                          {property.area} m²
                        </span>
                      )}
                    </div>

                    {property.type === 'rent' ? (() => {
                      const { monthlyPrice, yearlyPrice } = calculateRentPrices(property.price, property.rent_period)
                      return (
                        <>
                          <div style={{
                            fontSize: '20px',
                            fontWeight: '700',
                            color: Colors.primary[400],
                            textShadow: '0 2px 8px rgba(0,0,0,0.5)',
                            marginBottom: '2px'
                          }}>
                            {formatPrice(monthlyPrice)} / {t('propertyCard.month')}
                          </div>
                          <div style={{
                            fontSize: '12px',
                            fontWeight: '500',
                            color: 'rgba(255,255,255,0.8)',
                            textShadow: '0 1px 4px rgba(0,0,0,0.5)'
                          }}>
                            ({formatPrice(yearlyPrice)} / {t('propertyCard.year')})
                          </div>
                        </>
                      )
                    })() : (
                      <div style={{
                        fontSize: '20px',
                        fontWeight: '700',
                        color: Colors.primary[400],
                        textShadow: '0 2px 8px rgba(0,0,0,0.5)'
                      }}>
                        {formatPrice(property.price)}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    marginTop: '12px'
                  }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/property/${property.id}`)
                      }}
                      style={{
                        flex: 1,
                        padding: '10px 20px',
                        backgroundColor: Colors.primary[600],
                        color: Colors.white,
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                      }}
                    >
                      {t('common.viewDetails')}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        // Share functionality
                      }}
                      style={{
                        padding: '10px',
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        color: Colors.white,
                        border: 'none',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backdropFilter: 'blur(10px)'
                      }}
                    >
                      <Share2 size={18} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Media Counter - Shows current media position within property (only if multiple media) */}
      {currentProperty && currentPropertyMedia.length > 1 && (
        <div 
          className="feed-media-counter"
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            zIndex: 15,
            padding: '6px 12px',
            backgroundColor: 'rgba(0,0,0,0.5)',
            borderRadius: '16px',
            color: Colors.white,
            fontSize: '12px',
            fontWeight: '600',
            backdropFilter: 'blur(10px)'
          }}
        >
          {currentMediaIdx + 1} / {currentPropertyMedia.length}
        </div>
      )}

      {/* Loading indicator */}
      {loading && (
        <div className="feed-loading" style={{ color: Colors.white }}>
          <p>{t('common.loading')}...</p>
        </div>
      )}
    </div>
  )
}
