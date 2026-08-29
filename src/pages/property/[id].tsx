import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  MapPin, 
  BedDouble, 
  Bath, 
  Share2, 
  Bookmark,
  X,
  CheckCircle2,
  User as UserIcon,
  ChevronRight,
  Star,
  ShieldCheck,
  Play
} from 'lucide-react'
import { useThemeMode } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/I18nContext'
import { getColors } from '@/constants/Colors'
import { useProperty, useSimilarProperties } from '@/hooks/useProperties'
import { useSavedProperty } from '@/hooks/useSavedProperties'
import { usePropertyReviews } from '@/hooks/usePropertyReviews'
import {
  formatLastVerified,
  isAvailabilityStale,
  usePropertyAvailability,
} from '@/hooks/usePropertyAvailability'
import { useAuth } from '@/contexts/AuthContext'
import { useShare } from '@/hooks/useShare'
import ModerationActions from '@/components/moderation/ModerationActions'
import { useReservations, usePropertyReservation } from '@/hooks/useReservations'
import { useFapshiPayment } from '@/hooks/useFapshiPayment'
import { formatPrice, calculateRentPrices, createPropertyUrl } from '@/utils/shareUtils'
import { generatePropertyStructuredData, getCanonicalBaseUrl } from '@/utils/seoUtils'
import { getPaymentStatus } from '@/lib/fapshi'
import { isVideoUrl, separateMedia, generateVideoThumbnail } from '@/utils/videoUtils'
import PropertyCard from '@/components/PropertyCard'
import ReservationModal from '@/components/ReservationModal'
import VideoPlayer from '@/components/VideoPlayer'
import SEO from '@/components/SEO'
import './PropertyDetail.css'

type PaymentMethod = 'mtn' | 'orange'

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { colorScheme } = useThemeMode()
  const { t, currentLanguage } = useLanguage()
  const Colors = getColors(colorScheme)
  const { user } = useAuth()
  const { isSharing, shareProperty } = useShare()
  const { processDirectPayment, loading: paymentLoading } = useFapshiPayment()
  const { createReservation, updateReservationPayment, loading: reservationLoading } = useReservations(user?.id || '')
  const { hasActiveBooking } = usePropertyReservation(user?.id || '', id || '')

  const { property, loading, error } = useProperty(id || '')
  const { properties: similarProperties } = useSimilarProperties(
    id || '',
    property?.category || 'standard',
    property?.type || 'rent',
    3
  )

  const { isSaved, loading: savingProperty, toggleSaved } = useSavedProperty(user?.id, id)
  const { reviews: propertyReviews, averageRating, totalReviews: reviewsCount, loading: reviewsLoading } =
    usePropertyReviews(id || '')
  const isPropertyOwner = !!user?.id && user.id === property?.owner_id
  const {
    confirmedAt: availabilityConfirmedAt,
    confirming: confirmingAvailability,
    confirmAvailability,
  } = usePropertyAvailability(id, property?.owner_id, property?.availability_confirmed_at)
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0)
  const [showReservationModal, setShowReservationModal] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [waitingForPayment, setWaitingForPayment] = useState(false)
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [videoThumbnails, setVideoThumbnails] = useState<Record<string, string>>({})
  const [playingVideo, setPlayingVideo] = useState<string | null>(null)

  const allMedia = useMemo(() => {
    if (!property) return []
    const media = property.images && property.images.length > 0 
      ? property.images 
      : property.image 
        ? [property.image] 
        : []
    
    // Separate videos and images, videos first
    const { videos, images } = separateMedia(media)
    return [...videos, ...images]
  }, [property])

  const { videos, images } = useMemo(() => {
    return separateMedia(allMedia)
  }, [allMedia])

  // Generate thumbnails for videos
  useEffect(() => {
    const generateThumbnails = async () => {
      const thumbnails: Record<string, string> = {}
      for (const videoUrl of videos) {
        if (!videoThumbnails[videoUrl]) {
          try {
            const thumbnail = await generateVideoThumbnail(videoUrl)
            if (thumbnail) {
              thumbnails[videoUrl] = thumbnail
            }
          } catch (error) {
            console.error('Failed to generate thumbnail for', videoUrl, error)
          }
        }
      }
      if (Object.keys(thumbnails).length > 0) {
        setVideoThumbnails(prev => ({ ...prev, ...thumbnails }))
      }
    }
    
    if (videos.length > 0) {
      generateThumbnails()
    }
  }, [videos])

  const rentPrices = useMemo(() => {
    if (!property || property.type !== 'rent') return null
    return calculateRentPrices(property.price, property.rent_period)
  }, [property])

  const { totalFee } = useMemo(() => {
    const fee = property?.reservationFee || 5000
    return {
      totalFee: fee
    }
  }, [property?.reservationFee])

  const handleShare = async () => {
    if (property) {
      await shareProperty(property)
    }
  }

  const handleReserve = useCallback(() => {
    if (!user) {
      navigate('/auth/login')
      return
    }
    setShowReservationModal(true)
  }, [user, navigate])

  const handleToggleSaved = useCallback(async () => {
    if (!user) {
      navigate('/auth/login')
      return
    }
    const result = await toggleSaved()
    if (!result.ok && result.error) {
      setSaveError(t('saved.saveFailed'))
      setTimeout(() => setSaveError(null), 4000)
    }
  }, [user, navigate, toggleSaved, t])

  const handleConfirmAvailability = useCallback(async () => {
    const result = await confirmAvailability()
    if (!result.ok) {
      setSaveError(
        result.reason === 'missing_media'
          ? t('availability.confirmNeedsPhoto', 'Add at least one photo to this listing before confirming it.')
          : t('availability.confirmFailed', 'Could not confirm availability. Please try again.')
      )
      setTimeout(() => setSaveError(null), 4000)
    }
  }, [confirmAvailability, t])

  const closeModal = useCallback(() => {
    setShowReservationModal(false)
    setSelectedPaymentMethod(null)
    setPhoneNumber('')
    setPaymentMessage(null)
    setWaitingForPayment(false)
  }, [])

  const handlePaymentMethodSelect = useCallback((method: PaymentMethod) => {
    setSelectedPaymentMethod(method)
  }, [])

  const handleConfirmReservation = async () => {
    if (!selectedPaymentMethod || !phoneNumber) {
      setPaymentMessage(t('propertyDetails.pleaseSelectPaymentAndPhone'))
      return
    }
    if (!user || !property) {
      setPaymentMessage(t('property.mustBeLoggedIn'))
      return
    }
    // Pre-insert a `pending` reservation BEFORE initiating MeSomb so the row
    // exists even if the client crashes / closes / loses connection between
    // payment confirmation and our follow-up update. The poll loop below
    // promotes it to `confirmed`; failed outcomes flip it to `cancelled`.
    let pendingReservationId: string | null = null

    try {
      setWaitingForPayment(true)
      setPaymentMessage(t('buttons.processing'))

      const today = new Date()
      const reservationDate = new Date(today)
      reservationDate.setDate(today.getDate() + 1)

      const pendingReservation = await createReservation(
        property.id,
        reservationDate.toISOString().split('T')[0],
        null,
        {
          status: 'pending',
          amount: totalFee,
          payment_status: 'initiated',
        },
      )
      pendingReservationId = pendingReservation?.id ?? null
      if (!pendingReservationId) {
        throw new Error('Failed to create pending reservation')
      }

      // Pass reservation id as externalId so MeSomb echoes it back as `reference`
      // on the webhook payload for later server-side reconciliation.
      const { transId } = await processDirectPayment(
        totalFee,
        user.id,
        phoneNumber,
        {
          message: `Reservation for ${property.title}`,
          externalId: pendingReservationId,
          name: user.full_name || undefined,
          email: user.email || undefined,
          medium: selectedPaymentMethod === 'orange' ? 'orange money' : 'mobile money',
        },
      )

      setPaymentMessage(t('wallet.waitingForPayment'))

      // Poll up to ~5 minutes (100 × 3 s). PIN entry on Cameroon mobile
      // networks routinely takes 30–90 s — the previous 30 s window was the
      // root cause of payments that were taken but never bookable.
      let status: string | null = null
      const POLL_INTERVAL_MS = 3000
      const POLL_MAX_ATTEMPTS = 100
      for (let attempts = 0; attempts < POLL_MAX_ATTEMPTS; attempts++) {
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
        try {
          const result = await getPaymentStatus(transId)
          status = result.status
        } catch (err) {
          // Transient network: keep polling.
          console.warn('Error checking payment status, retrying:', err)
          continue
        }
        if (status === 'SUCCESSFUL') break
        if (status === 'FAILED' || status === 'EXPIRED') break
      }

      if (status === 'SUCCESSFUL') {
        await updateReservationPayment(pendingReservationId, property.id, 'confirmed', {
          transaction_id: transId,
        })
        setPaymentMessage(t('reservations.reservationCreated'))
        setTimeout(() => {
          closeModal()
          navigate('/user/reservations')
        }, 2000)
      } else if (status === 'FAILED' || status === 'EXPIRED') {
        await updateReservationPayment(pendingReservationId, property.id, 'failed', {
          transaction_id: transId,
        })
        setPaymentMessage(t('wallet.paymentFailed'))
        setWaitingForPayment(false)
      } else {
        // Polling exceeded — leave the row `pending`. The user sees it in their
        // bookings; the eventual MeSomb webhook (or a manual status check) can
        // finalise it. Don't mark it failed: MeSomb may still confirm async.
        setPaymentMessage(t('wallet.paymentTimeout'))
        setWaitingForPayment(false)
      }
    } catch (error: any) {
      console.error('Reservation error:', error)
      // Initiation itself failed — clean up the pending row so the property
      // doesn't stay locked as `reserved`.
      if (pendingReservationId) {
        try {
          await updateReservationPayment(pendingReservationId, property.id, 'failed')
        } catch (cleanupErr) {
          console.warn('Failed to roll back pending reservation:', cleanupErr)
        }
      }
      setPaymentMessage(error.message || t('reservations.reservationCreationFailed'))
      setWaitingForPayment(false)
    }
  }

  // Generate structured data for SEO - MUST be before early returns
  const structuredData = useMemo(() => {
    if (!property) return undefined
    return generatePropertyStructuredData(property, rentPrices || undefined)
  }, [property, rentPrices])

  const isOwner = user?.id === property?.owner_id

  if (loading) {
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center', 
        color: Colors.neutral[600] 
      }}>
        {t('common.loading')}...
      </div>
    )
  }

  if (error || !property) {
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center', 
        color: Colors.error[600] 
      }}>
        {error || t('property.notFound')}
      </div>
    )
  }

  // Get current language from i18n
  const currentLang = typeof window !== 'undefined' 
    ? localStorage.getItem('user-language') || 'en'
    : 'en'
  
  // Language-aware SEO content
  const seoTitle = property 
    ? `${property.title} - ${formatPrice(property.type === 'rent' && rentPrices ? rentPrices.monthlyPrice : property.price)} | Propella`
    : currentLang === 'fr' ? 'Propriété | Propella' : 'Property | Propella'
  
  const seoDescription = property 
    ? currentLang === 'fr'
      ? `${property.title} à ${property.location}, Cameroun. ${property.type === 'rent' ? 'Location' : 'Vente'} - ${formatPrice(property.type === 'rent' && rentPrices ? rentPrices.monthlyPrice : property.price)}. ${property.description ? property.description.substring(0, 120) : ''}`
      : `${property.title} in ${property.location}, Cameroon. ${property.type === 'rent' ? 'For Rent' : 'For Sale'} - ${formatPrice(property.type === 'rent' && rentPrices ? rentPrices.monthlyPrice : property.price)}. ${property.description ? property.description.substring(0, 120) : ''}`
    : currentLang === 'fr' 
      ? 'Découvrez cette propriété sur Propella'
      : 'Discover this property on Propella'
  
  const seoKeywords = property
    ? currentLang === 'fr'
      ? `${property.title}, ${property.location}, immobilier Cameroun, ${property.type === 'rent' ? 'location' : 'vente'} ${property.category}, Propella`
      : `${property.title}, ${property.location}, real estate Cameroon, ${property.type === 'rent' ? 'rent' : 'sale'} ${property.category}, Propella`
    : undefined
  
  const baseUrl = getCanonicalBaseUrl()
  
  // Get the first media (image or video thumbnail) for SEO
  const getFirstMediaUrl = () => {
    if (!property) return '/app-icon.png'
    
    const firstMedia = property.images?.[0] || property.image
    if (!firstMedia) return '/app-icon.png'
    
    // If it's already a full URL (Cloudflare, etc.), use it directly
    if (firstMedia.startsWith('http://') || firstMedia.startsWith('https://')) {
      return firstMedia
    }
    
    // If it's a relative URL, make it absolute
    return `${baseUrl}${firstMedia.startsWith('/') ? firstMedia : '/' + firstMedia}`
  }
  
  const seoImage = getFirstMediaUrl()
  const seoUrl = property ? createPropertyUrl(property) : undefined

  return (
    <>
      <SEO
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        image={seoImage}
        url={seoUrl}
        type="article"
        structuredData={structuredData}
      />
      <div className="property-detail" style={{ backgroundColor: Colors.neutral[50], minHeight: '100vh', paddingBottom: '100px' }}>
      {/* Header with Back Button */}
      <div className="property-header" style={{ 
        position: 'sticky',
        top: 0,
        zIndex: 10,
        backgroundColor: Colors.white,
        borderBottom: `1px solid ${Colors.neutral[200]}`,
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px',
            borderRadius: '8px',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = Colors.neutral[100]
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
        >
          <ArrowLeft size={24} color={Colors.neutral[700]} />
        </button>
        <h1 style={{ 
          flex: 1,
          fontSize: '18px',
          fontWeight: '600',
          color: Colors.neutral[900],
          margin: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {property.title}
        </h1>
        <button
          onClick={handleShare}
          disabled={isSharing}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '8px',
            transition: 'background 0.2s'
          }}
        >
          <Share2 size={20} color={Colors.neutral[700]} />
        </button>
        {!isOwner && property?.owner_id ? (
          <ModerationActions
            targetUserId={property.owner_id}
            contentType="property"
            contentId={property.id}
            size="compact"
            onBlocked={() => navigate(-1)}
          />
        ) : null}
      </div>

      {/* Media Gallery (Videos + Images) */}
      {allMedia.length > 0 && (
        <div className="property-images">
          <div className="main-image-container">
            {playingVideo === allMedia[currentMediaIndex] ? (
              <VideoPlayer
                src={allMedia[currentMediaIndex]}
                thumbnail={videoThumbnails[allMedia[currentMediaIndex]]}
                autoPlay
                controls
                onClose={() => setPlayingVideo(null)}
                className="main-video"
              />
            ) : isVideoUrl(allMedia[currentMediaIndex]) ? (
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  cursor: 'pointer',
                }}
                onClick={() => setPlayingVideo(allMedia[currentMediaIndex])}
              >
                {videoThumbnails[allMedia[currentMediaIndex]] ? (
                  <img
                    src={videoThumbnails[allMedia[currentMediaIndex]]}
                    alt={property.title}
                    className="main-image"
                    loading="eager"
                    decoding="async"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <video
                    src={`${allMedia[currentMediaIndex]}#t=0.5`}
                    className="main-image"
                    preload="metadata"
                    muted
                    playsInline
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                )}
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
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
                    e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)'
                  }}
                >
                  <Play size={32} color="#FFFFFF" fill="#FFFFFF" />
                </div>
              </div>
            ) : (
              <img
                src={allMedia[currentMediaIndex]}
                alt={property.title}
                className="main-image"
                loading="eager"
                decoding="async"
              />
            )}
            {allMedia.length > 1 && (
              <>
                <button
                  className="image-nav prev"
                  onClick={() => {
                    setCurrentMediaIndex((prev) => 
                      prev > 0 ? prev - 1 : allMedia.length - 1
                    )
                    setPlayingVideo(null)
                  }}
                >
                  ←
                </button>
                <button
                  className="image-nav next"
                  onClick={() => {
                    setCurrentMediaIndex((prev) => 
                      prev < allMedia.length - 1 ? prev + 1 : 0
                    )
                    setPlayingVideo(null)
                  }}
                >
                  →
                </button>
                <div className="image-indicator">
                  {currentMediaIndex + 1} / {allMedia.length}
                </div>
              </>
            )}
          </div>
          {allMedia.length > 1 && (
            <div className="thumbnail-container hidden-scrollbar">
              {allMedia.slice(0, 5).map((media, idx) => {
                const isVideo = isVideoUrl(media)
                const thumbnail = isVideo ? videoThumbnails[media] : media
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setCurrentMediaIndex(idx)
                      setPlayingVideo(null)
                    }}
                    className={`thumbnail ${currentMediaIndex === idx ? 'active' : ''}`}
                    style={{ position: 'relative' }}
                  >
                    {isVideo && !thumbnail ? (
                      <video
                        src={`${media}#t=0.5`}
                        preload="metadata"
                        muted
                        playsInline
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <img
                        src={thumbnail || media}
                        alt={`${property.title} ${idx + 1}`}
                        loading="lazy"
                        decoding="async"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    )}
                    {isVideo && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(0, 0, 0, 0.6)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Play size={12} color="#FFFFFF" fill="#FFFFFF" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Property Info */}
      <div className="property-content">
        {/* Price and Title */}
        <div style={{ marginBottom: '16px' }}>
          {property.type === 'rent' && rentPrices ? (
            <>
              <div style={{ 
                fontSize: '28px', 
                fontWeight: '700', 
                color: Colors.primary[800],
                marginBottom: '4px'
              }}>
                {formatPrice(rentPrices.monthlyPrice)} / {t('propertyCard.month')}
              </div>
              <div style={{ 
                fontSize: '14px', 
                color: Colors.neutral[600],
                marginBottom: '8px'
              }}>
                ({formatPrice(rentPrices.yearlyPrice)} / {t('propertyCard.year')})
              </div>
            </>
          ) : (
            <div style={{ 
              fontSize: '28px', 
              fontWeight: '700', 
              color: Colors.primary[800],
              marginBottom: '8px'
            }}>
              {formatPrice(property.price)}
            </div>
          )}
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: '600', 
            color: Colors.neutral[900],
            marginTop: '8px'
          }}>
            {property.title}
          </h2>
        </div>

        {/* Location */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px',
          color: Colors.neutral[600],
          marginBottom: '20px'
        }}>
          <MapPin size={18} />
          <span>{property.town ? `${property.town}, ${property.location}` : property.location}</span>
        </div>

        {/* Availability freshness. Clients see when the listing was last
            confirmed; the owner gets the one-tap way to refresh it. */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
          marginBottom: '20px'
        }}>
          <ShieldCheck
            size={16}
            color={isAvailabilityStale(availabilityConfirmedAt) ? Colors.warning[600] : Colors.success[600]}
          />
          <span style={{ fontSize: '13px', fontWeight: 500, color: Colors.neutral[600] }}>
            {formatLastVerified(availabilityConfirmedAt, t, currentLanguage)}
          </span>
          {isPropertyOwner && (
            <button
              onClick={handleConfirmAvailability}
              disabled={confirmingAvailability}
              style={{
                backgroundColor: Colors.primary[50],
                border: `1px solid ${Colors.primary[200]}`,
                borderRadius: '999px',
                padding: '4px 10px',
                fontSize: '12px',
                fontWeight: 600,
                color: Colors.primary[700],
                cursor: confirmingAvailability ? 'default' : 'pointer',
                opacity: confirmingAvailability ? 0.6 : 1
              }}
            >
              {confirmingAvailability
                ? t('common.loading')
                : t('availability.confirmStillAvailable', 'Confirm still available')}
            </button>
          )}
        </div>

        {/* Badges */}
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          marginBottom: '20px',
          flexWrap: 'wrap'
        }}>
          {property.isVerified && (
            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: Colors.success[100],
              color: Colors.success[700],
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              <CheckCircle2 size={14} />
              {t('property.verified')}
            </span>
          )}
          <span style={{
            backgroundColor: Colors.primary[100],
            color: Colors.primary[700],
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600',
            textTransform: 'capitalize'
          }}>
            {t(`property.${property.category}`)}
          </span>
          <span style={{
            backgroundColor: Colors.neutral[100],
            color: Colors.neutral[700],
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600',
            textTransform: 'capitalize'
          }}>
            {property.type === 'rent' ? t('property.forRent') : t('property.forSale')}
          </span>
        </div>

        {/* Description */}
        {property.description && (
          <div style={{ 
            backgroundColor: Colors.white,
            padding: '20px',
            borderRadius: '12px',
            marginBottom: '20px'
          }}>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: '600', 
              color: Colors.neutral[900],
              marginBottom: '12px'
            }}>
              {t('property.description')}
            </h3>
            <p style={{ 
              fontSize: '14px', 
              color: Colors.neutral[700],
              lineHeight: '1.6'
            }}>
              {property.description}
            </p>
          </div>
        )}

        {/* Features */}
        <div className="property-features" style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '16px',
          padding: '20px',
          backgroundColor: Colors.white,
          borderRadius: '12px',
          marginBottom: '20px'
        }}>
          {property.bedrooms !== undefined && property.bedrooms !== null && (
            <div style={{ textAlign: 'center' }}>
              <BedDouble size={24} color={Colors.primary[600]} style={{ marginBottom: '8px' }} />
              <div style={{ fontSize: '14px', color: Colors.neutral[600] }}>
                {property.bedrooms} {t('property.bedrooms')}
              </div>
            </div>
          )}
          {property.bathrooms !== undefined && property.bathrooms !== null && (
            <div style={{ textAlign: 'center' }}>
              <Bath size={24} color={Colors.primary[600]} style={{ marginBottom: '8px' }} />
              <div style={{ fontSize: '14px', color: Colors.neutral[600] }}>
                {property.bathrooms} {t('property.bathrooms')}
              </div>
            </div>
          )}
          {property.area && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: '600', color: Colors.primary[600], marginBottom: '8px' }}>
                {property.area}m²
              </div>
              <div style={{ fontSize: '14px', color: Colors.neutral[600] }}>
                {t('property.area')}
              </div>
            </div>
          )}
        </div>

        {/* Agent Information */}
        {property.owner && (
          <div style={{ 
            backgroundColor: Colors.white,
            padding: '20px 16px',
            borderRadius: '12px',
            marginBottom: '20px',
            maxWidth: '100%'
          }}>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: '600', 
              color: Colors.neutral[900],
              marginBottom: '16px'
            }}>
              {t('propertyDetails.propertyAgent')}
            </h3>
            <div
              onClick={() => navigate(`/agents/${property.owner?.id}`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                backgroundColor: Colors.neutral[50],
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                border: `1px solid ${Colors.neutral[200]}`,
                minWidth: 0,
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = Colors.neutral[100]
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = Colors.neutral[50]
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              {property.owner.avatar_url ? (
                <img
                  src={property.owner.avatar_url}
                  alt={property.owner.full_name || 'Agent'}
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '28px',
                    objectFit: 'cover',
                    border: `2px solid ${Colors.neutral[200]}`,
                    flexShrink: 0
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              ) : (
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '28px',
                  backgroundColor: Colors.neutral[200],
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `2px solid ${Colors.neutral[300]}`,
                  flexShrink: 0
                }}>
                  <UserIcon size={24} color={Colors.neutral[500]} />
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                <div style={{ 
                  fontSize: '16px', 
                  fontWeight: '600', 
                  color: Colors.neutral[900],
                  marginBottom: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  <span style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {property.owner.full_name || t('property.owner')}
                  </span>
                  {property.isVerified && (
                    <CheckCircle2 size={16} color={Colors.success[600]} style={{ flexShrink: 0 }} />
                  )}
                </div>
                <div style={{ 
                  fontSize: '13px', 
                  color: Colors.neutral[600],
                  marginBottom: '8px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {property.isVerified ? t('agentProfile.verifiedAgent') : t('property.owner')}
                </div>
                {/* Rating Display */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexWrap: 'nowrap' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={13}
                      color={Colors.warning[500]}
                      fill={Colors.warning[500]}
                    />
                  ))}
                  <span style={{ 
                    fontSize: '13px', 
                    fontWeight: '600', 
                    color: Colors.neutral[700],
                    marginLeft: '4px',
                    flexShrink: 0
                  }}>
                    5.0
                  </span>
                </div>
              </div>
              <ChevronRight size={18} color={Colors.neutral[400]} style={{ flexShrink: 0 }} />
            </div>
          </div>
        )}

        {/* Reviews */}
        <div style={{ marginTop: '40px' }}>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: Colors.neutral[900],
            marginBottom: '16px'
          }}>
            {t('propertyDetails.reviews', 'Reviews')}
            {reviewsCount > 0 ? ` (${reviewsCount})` : ''}
          </h3>

          {reviewsLoading ? (
            <p style={{ color: Colors.neutral[500] }}>{t('loading.loadingReviews', 'Loading reviews...')}</p>
          ) : propertyReviews.length === 0 ? (
            <p style={{ color: Colors.neutral[500] }}>{t('property.noReviewsYet', 'No reviews yet')}</p>
          ) : (
            <>
              {averageRating !== null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <Star size={18} color="#F59E0B" fill="#F59E0B" />
                  <span style={{ fontSize: '16px', fontWeight: 600, color: Colors.neutral[900] }}>
                    {averageRating.toFixed(1)}
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {propertyReviews.slice(0, 5).map((review) => (
                  <div
                    key={review.id}
                    style={{
                      border: `1px solid ${Colors.neutral[200]}`,
                      borderRadius: '12px',
                      padding: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 600, color: Colors.neutral[900] }}>
                        {review.user?.full_name || t('common.anonymous', 'Anonymous')}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: Colors.neutral[600], fontSize: '13px' }}>
                        <Star size={14} color="#F59E0B" fill="#F59E0B" />
                        {review.rating}
                      </span>
                    </div>
                    {review.comment && (
                      <p style={{ color: Colors.neutral[700], fontSize: '14px', margin: 0 }}>{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Similar Properties */}
        {similarProperties.length > 0 && (
          <div style={{ marginTop: '40px', position: 'relative' }}>
            <h3 style={{ 
              fontSize: '20px', 
              fontWeight: '600', 
              color: Colors.neutral[900],
              marginBottom: '16px'
            }}>
              {t('property.similarProperties')}
            </h3>

            {/* Scroll Left Button - Desktop Only */}
            <button
              onClick={() => {
                const container = document.getElementById('similar-properties-scroll-container')
                if (container) {
                  container.scrollBy({ left: -340, behavior: 'smooth' })
                }
              }}
              className="horizontal-scroll-arrow left"
              style={{
                position: 'absolute',
                left: '0',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 10,
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: Colors.white,
                border: `1px solid ${Colors.neutral[200]}`,
                display: 'none',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = Colors.neutral[50]
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = Colors.white
                e.currentTarget.style.transform = 'translateY(-50%) scale(1)'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={Colors.neutral[700]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>

            <div id="similar-properties-scroll-container" className="property-grid horizontal-scroll">
              {similarProperties.map((prop) => (
                <PropertyCard key={prop.id} property={prop} />
              ))}
            </div>

            {/* Scroll Right Button - Desktop Only */}
            <button
              onClick={() => {
                const container = document.getElementById('similar-properties-scroll-container')
                if (container) {
                  container.scrollBy({ left: 340, behavior: 'smooth' })
                }
              }}
              className="horizontal-scroll-arrow right"
              style={{
                position: 'absolute',
                right: '0',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 10,
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: Colors.white,
                border: `1px solid ${Colors.neutral[200]}`,
                display: 'none',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = Colors.neutral[50]
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = Colors.white
                e.currentTarget.style.transform = 'translateY(-50%) scale(1)'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={Colors.neutral[700]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
        )}
      </div>

      {saveError && (
        <div
          role="alert"
          style={{
            position: 'fixed',
            bottom: '96px',
            left: '50%',
            transform: 'translateX(-50%)',
            maxWidth: '90vw',
            padding: '12px 16px',
            borderRadius: '10px',
            backgroundColor: Colors.error[600],
            color: Colors.white,
            fontSize: '14px',
            fontWeight: 500,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            zIndex: 200
          }}
        >
          {saveError}
        </div>
      )}

      {/* Bottom Action Bar */}
      <div className="property-bottom-bar" style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '16px',
        backgroundColor: Colors.white,
        borderTop: `1px solid ${Colors.neutral[200]}`,
        boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.1)',
        zIndex: 100
      }}>
        <button
          onClick={handleToggleSaved}
          disabled={savingProperty}
          title={isSaved ? t('saved.removeFromSaved') : t('saved.addToSaved')}
          aria-label={isSaved ? t('saved.removeFromSaved') : t('saved.addToSaved')}
          aria-pressed={isSaved}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            border: `1px solid ${isSaved ? Colors.primary[800] : Colors.neutral[200]}`,
            backgroundColor: Colors.white,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: savingProperty ? 'default' : 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = Colors.neutral[50]
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = Colors.white
          }}
        >
          <Bookmark
            size={24}
            color={Colors.primary[800]}
            fill={isSaved ? Colors.primary[800] : 'transparent'}
          />
        </button>
        {!isOwner && (
          hasActiveBooking ? (
            <button
              onClick={() => navigate(`/chat/${property.owner_id}?propertyId=${property.id}`)}
              style={{
                flex: 1,
                padding: '16px',
                backgroundColor: Colors.primary[600],
                color: Colors.white,
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = Colors.primary[700]
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = Colors.primary[600]
              }}
            >
              {t('propertyDetails.messageAgent')}
            </button>
          ) : (
            <button
              onClick={handleReserve}
              disabled={reservationLoading || paymentLoading}
              style={{
                flex: 1,
                padding: '16px',
                backgroundColor: Colors.primary[600],
                color: Colors.white,
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: (reservationLoading || paymentLoading) ? 'not-allowed' : 'pointer',
                opacity: (reservationLoading || paymentLoading) ? 0.6 : 1,
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!reservationLoading && !paymentLoading) {
                  e.currentTarget.style.backgroundColor = Colors.primary[700]
                }
              }}
              onMouseLeave={(e) => {
                if (!reservationLoading && !paymentLoading) {
                  e.currentTarget.style.backgroundColor = Colors.primary[600]
                }
              }}
            >
              {reservationLoading || paymentLoading ? t('buttons.processing') : t('propertyDetails.bookSiteVisit')}
            </button>
          )
        )}
      </div>

      {/* Reservation Modal */}
      <ReservationModal
        visible={showReservationModal}
        onClose={closeModal}
        onConfirm={handleConfirmReservation}
        totalFee={totalFee}
        propertyTitle={property.title}
        selectedPaymentMethod={selectedPaymentMethod}
        onPaymentMethodSelect={handlePaymentMethodSelect}
        phoneNumber={phoneNumber}
        onPhoneNumberChange={setPhoneNumber}
        loading={waitingForPayment}
        message={paymentMessage}
      />
      </div>
    </>
  )
}
