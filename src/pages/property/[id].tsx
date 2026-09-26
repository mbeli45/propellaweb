import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ChevronLeft,
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
  Play,
  BadgeCheck,
  ChefHat,
  Ruler,
  Building2,
  CalendarClock,
  Navigation,
  Phone,
  MessageCircle,
} from 'lucide-react'
import { useThemeMode } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/I18nContext'
import { getColors } from '@/constants/Colors'
import { useProperty, useSimilarProperties } from '@/hooks/useProperties'
import { useGeocoding } from '@/hooks/useGeocoding'
import MapView from '@/components/MapView'
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
import { isVideoUrl, separateMedia } from '@/utils/videoUtils'
import PropertyCard from '@/components/PropertyCard'
import VideoThumbnail from '@/components/VideoThumbnail'
import ReservationModal, { PAYMENT_MIN_WAIT_SECONDS } from '@/components/ReservationModal'
import VideoPlayer from '@/components/VideoPlayer'
import SEO from '@/components/SEO'
import './PropertyDetail.css'
import { PropertyDetailSkeleton, ListItemSkeleton } from '@/components/skeletons'
import { EmptyState } from '@/components/reservations/ReservationUI'

type PaymentMethod = 'mtn' | 'orange'

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  // The feed's "Book Site Visit" button deep-links here rather than
  // duplicating the reservation modal inside the feed.
  const requestedAction = searchParams.get('action')
  const handledDeepLinkAction = useRef(false)
  const { colorScheme } = useThemeMode()
  const { t, currentLanguage } = useLanguage()
  const Colors = getColors(colorScheme)
  const { user } = useAuth()
  const { isSharing, shareProperty } = useShare()
  const { processDirectPayment, loading: paymentLoading } = useFapshiPayment()
  const { createReservation, updateReservationPayment, loading: reservationLoading } = useReservations(user?.id || '')
  const { hasActiveBooking } = usePropertyReservation(user?.id || '', id || '')

  const { property, loading, error } = useProperty(id || '')
  // Coordinate for the embedded map: saved coordinates, else geocode the location.
  const { geocodeLocation } = useGeocoding()
  const [mapCoordinate, setMapCoordinate] = useState<[number, number] | null>(null)
  useEffect(() => {
    if (!property) return
    const lat = Number(property.latitude)
    const lng = Number(property.longitude)
    if (property.latitude != null && property.longitude != null && Number.isFinite(lat) && Number.isFinite(lng)) {
      setMapCoordinate([lng, lat])
      return
    }
    let active = true
    const query = property.town ? `${property.town}, ${property.location}` : property.location
    if (query) {
      geocodeLocation(query).then((coords) => {
        if (active && coords && Array.isArray(coords) && coords.length === 2) setMapCoordinate(coords as [number, number])
      })
    }
    return () => {
      active = false
    }
  }, [property?.id, property?.latitude, property?.longitude, property?.location, property?.town, geocodeLocation])
  const noMapMarkers = useMemo(() => [], [])
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
  const [paymentStartedAt, setPaymentStartedAt] = useState<number | null>(null)
  const [paymentElapsed, setPaymentElapsed] = useState(0)
  // Set when the customer closes the modal after the minimum wait: stop
  // polling quietly and leave the reservation pending for the webhook.
  const paymentAbandonedRef = useRef(false)

  useEffect(() => {
    if (!paymentStartedAt) {
      setPaymentElapsed(0)
      return
    }
    const tick = () => setPaymentElapsed(Math.floor((Date.now() - paymentStartedAt) / 1000))
    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [paymentStartedAt])
  const [saveError, setSaveError] = useState<string | null>(null)
  const videoThumbnails: Record<string, string> = {}
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

  // Open the reservation modal once the property has loaded.
  useEffect(() => {
    if (handledDeepLinkAction.current || requestedAction !== 'book' || !property) return
    handledDeepLinkAction.current = true
    handleReserve()
  }, [requestedAction, property, handleReserve])

  const paymentLocked = paymentStartedAt !== null && paymentElapsed < PAYMENT_MIN_WAIT_SECONDS

  const closeModal = useCallback(() => {
    // Keep the modal open while the customer is still expected to approve.
    if (paymentLocked) return
    if (paymentStartedAt !== null) paymentAbandonedRef.current = true
    setShowReservationModal(false)
    setSelectedPaymentMethod(null)
    setPhoneNumber('')
    setPaymentMessage(null)
    setWaitingForPayment(false)
    setPaymentStartedAt(null)
  }, [paymentLocked, paymentStartedAt])

  const handlePaymentMethodSelect = useCallback((method: PaymentMethod) => {
    setSelectedPaymentMethod(method)
  }, [])

  const handleConfirmReservation = async () => {
    // A second click while a request is out would charge the customer twice.
    if (waitingForPayment) return
    paymentAbandonedRef.current = false
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
          referral_deal_id: searchParams.get('deal') || undefined,
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

      setPaymentMessage(null)
      const startedAt = Date.now()
      setPaymentStartedAt(startedAt)

      // Poll up to ~5 minutes (100 × 3 s). PIN entry on Cameroon mobile
      // networks routinely takes 30–90 s — the previous 30 s window was the
      // root cause of payments that were taken but never bookable.
      let status: string | null = null
      const POLL_INTERVAL_MS = 3000
      const POLL_MAX_ATTEMPTS = 100
      for (let attempts = 0; attempts < POLL_MAX_ATTEMPTS; attempts++) {
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
        // Closed after the minimum wait: the reservation stays pending and is
        // finalised by the payment webhook.
        if (paymentAbandonedRef.current) return
        try {
          const result = await getPaymentStatus(transId)
          status = result.status
        } catch (err) {
          // Transient network: keep polling.
          console.warn('Error checking payment status, retrying:', err)
          continue
        }
        if (status === 'SUCCESSFUL') break
        if (status === 'FAILED' || status === 'EXPIRED') {
          // An early failure often just means the prompt hasn't been seen or
          // approved yet (the customer may be dialling the USSD code). Keep
          // waiting until the minimum window has passed.
          if (Date.now() - startedAt < PAYMENT_MIN_WAIT_SECONDS * 1000) continue
          break
        }
      }
      setPaymentStartedAt(null)

      if (status === 'SUCCESSFUL') {
        await updateReservationPayment(pendingReservationId, property.id, 'confirmed', {
          transaction_id: transId,
        })
        setPaymentMessage(t('reservations.reservationCreated'))
        setTimeout(() => {
          closeModal()
          // A visit booked from a client deal link returns to that deal.
          const dealId = searchParams.get('deal')
          navigate(dealId ? `/user/deals/${dealId}` : '/user/reservations')
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
      setPaymentStartedAt(null)
    }
  }

  // Opens our map focused on this listing: its saved coordinates when set,
  // otherwise its location is geocoded by the map page.
  const openInMaps = () => {
    if (!property) return
    const hasCoords = typeof property.latitude === 'number' && typeof property.longitude === 'number'
    const params = new URLSearchParams(
      hasCoords
        ? { focusLat: String(property.latitude), focusLng: String(property.longitude) }
        : { focusQuery: property.town ? `${property.town}, ${property.location}` : property.location },
    )
    navigate(`${user ? '/user/map' : '/guest/map'}?${params.toString()}`)
  }

  // Generate structured data for SEO - MUST be before early returns
  const structuredData = useMemo(() => {
    if (!property) return undefined
    return generatePropertyStructuredData(property, rentPrices || undefined)
  }, [property, rentPrices])

  const isOwner = user?.id === property?.owner_id

  if (loading) {
    return <PropertyDetailSkeleton />
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
      <div className="property-detail" style={{ backgroundColor: Colors.white, minHeight: '100vh', paddingBottom: '100px' }}>
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
          <ChevronLeft size={24} color={Colors.neutral[700]} />
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
        <div className="property-images" data-media-count={allMedia.length}>
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
                  <VideoThumbnail src={allMedia[currentMediaIndex]}
                    alt="Property video"
                    className="main-image"
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
            {property.listingVerified && (
              <span className="detail-verified-pill">
                <BadgeCheck size={14} aria-hidden="true" />
                {t('propertyDetails.verifiedListing')}
              </span>
            )}
          </div>
          {allMedia.length > 1 && (
            <div className="thumbnail-container hidden-scrollbar">
              {allMedia.map((media, idx) => {
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
                      <VideoThumbnail src={media}
                        alt="Property video"
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

      <section className="property-summary">
        {/* Reference and listing pills */}
        <div className="pd-ref-row">
          <span className="pd-ref">#{String(property.id).slice(0, 8).toUpperCase()}</span>
          <div className="pd-pills">
            <span className="pd-pill" style={{ backgroundColor: Colors.primary[50], color: Colors.primary[700] }}>
              {property.type === 'rent' ? t('propertyDetails.forRent') : t('propertyDetails.forSale')}
            </span>
            <span className="pd-pill" style={{ backgroundColor: Colors.neutral[100], color: Colors.neutral[700] }}>
              {t(`property.${property.category}`)}
            </span>
          </div>
        </div>

        <h2 className="pd-title">{property.title}</h2>
        <div className="pd-location">
          <MapPin size={18} aria-hidden="true" />
          <span>{property.town ? `${property.town}, ${property.location}` : property.location}</span>
          <button type="button" className="pd-link" onClick={openInMaps}>{t('propertyDetails.viewOnMap')}</button>
        </div>
        {averageRating !== null && reviewsCount > 0 && (
          <div className="pd-rating">
            <Star size={15} color="#F59E0B" fill="#F59E0B" aria-hidden="true" />
            <strong>{averageRating.toFixed(1)}</strong>
            <span>· {t('propertyDetails.reviewsCount', { count: reviewsCount })}</span>
          </div>
        )}

        {/* Price card: price, rent terms and availability freshness */}
        <div className="pd-price-card">
          {property.type === 'rent' && rentPrices ? (
            <>
              <div className="pd-price">{formatPrice(rentPrices.monthlyPrice)} / {t('propertyCard.month')}</div>
              <div className="pd-price-sub">({formatPrice(rentPrices.yearlyPrice)} / {t('propertyCard.year')})</div>
              {(property.advance_months_min || property.advance_months_max) && (
                <div className="pd-price-sub">
                  {t('propertyCard.advance', 'Advance')}: {property.advance_months_min || 6}–{property.advance_months_max || 12} {t('propertyCard.months', 'months')}
                </div>
              )}
            </>
          ) : (
            <div className="pd-price">{formatPrice(property.price)}</div>
          )}
          <div className="pd-divider" />
          {/* Availability freshness. Clients see when the listing was last
              confirmed; the owner gets the one-tap way to refresh it. */}
          <div className="pd-availability">
            <ShieldCheck
              size={16}
              color={isAvailabilityStale(availabilityConfirmedAt) ? Colors.warning[600] : Colors.success[600]}
              aria-hidden="true"
            />
            <span>{formatLastVerified(availabilityConfirmedAt, t, currentLanguage)}</span>
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
        </div>

        {/* Specifications: only what the listing actually has */}
        {(() => {
          const specs = [
            property.bedrooms ? { icon: BedDouble, value: String(property.bedrooms), label: t('propertyDetails.bedrooms') } : null,
            property.bathrooms ? { icon: Bath, value: String(property.bathrooms), label: t('propertyDetails.bathrooms') } : null,
            property.kitchen ? { icon: ChefHat, value: String(property.kitchen), label: t('propertyDetails.kitchens') } : null,
            property.area ? { icon: Ruler, value: `${property.area} m²`, label: t('propertyDetails.area') } : null,
            property.property_type
              ? { icon: Building2, value: property.property_type.charAt(0).toUpperCase() + property.property_type.slice(1), label: t('propertyDetails.propertyType') }
              : null,
            property.type === 'rent' && property.rent_period
              ? { icon: CalendarClock, value: property.rent_period === 'yearly' ? t('propertyDetails.yearly') : t('propertyDetails.monthly'), label: t('propertyDetails.rentPeriod') }
              : null,
          ].filter(Boolean) as { icon: typeof BedDouble; value: string; label: string }[]
          if (specs.length === 0) return null
          return (
            <>
              <div className="pd-section-label">{t('propertyDetails.specifications')}</div>
              <div className="pd-spec-grid">
                {specs.map(({ icon: Icon, value, label }) => (
                  <div key={label} className="pd-spec">
                    <Icon size={20} aria-hidden="true" />
                    <strong>{value}</strong>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </>
          )
        })()}

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
        {!isOwner && !hasActiveBooking && (
          <div className="pd-bottom-summary">
            <span>{t('propertyDetails.visitFee')}</span>
            <strong>{formatPrice(totalFee)}</strong>
          </div>
        )}
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

      </section>

      {/* Property Info */}
      <div className="property-content">
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

        {/* Amenities */}
        {property.amenities && property.amenities.length > 0 && (
          <div className="pd-card">
            <h3>{t('propertyDetails.amenities')}</h3>
            <div className="pd-amenities">
              {property.amenities.map((amenity, index) => (
                <div key={index} className="pd-amenity">
                  <CheckCircle2 size={18} aria-hidden="true" />
                  <span>{amenity}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Location map (our Mapbox map); open the full map for more */}
        {mapCoordinate && (
          <div className="pd-card">
            <h3>{t('propertyDetails.location')}</h3>
            <div className="pd-inline-map">
              <MapView markers={noMapMarkers} focus={mapCoordinate} scrollZoom={false} />
            </div>
            <button
              type="button"
              className="pd-link"
              style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
              onClick={openInMaps}
            >
              <Navigation size={16} aria-hidden="true" />
              {t('propertyDetails.openFullMap')}
            </button>
          </div>
        )}

        {/* Agent: who lists this property. Contact opens once a visit is booked. */}
        {property.owner && (
          <div className="pd-card">
            <h3>{t('propertyDetails.propertyAgent')}</h3>
            <button type="button" className="pd-owner-row" onClick={() => navigate(`/agents/${property.owner?.id}`)}>
              {property.owner.avatar_url ? (
                <img src={property.owner.avatar_url} alt="" className="pd-owner-avatar" loading="lazy" />
              ) : (
                <span className="pd-owner-avatar"><UserIcon size={24} color={Colors.neutral[500]} aria-hidden="true" /></span>
              )}
              <span style={{ flex: 1, minWidth: 0 }}>
                <span className="pd-owner-name">
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {property.owner.full_name || t('property.owner')}
                  </span>
                  {property.owner.is_verified_agent && <BadgeCheck size={17} aria-label={t('agentProfile.verifiedAgent')} />}
                </span>
                <span className="pd-owner-role" style={{ display: 'block' }}>
                  {property.owner.is_verified_agent
                    ? t('agentProfile.verifiedAgent')
                    : property.owner.role === 'agent'
                      ? t('propertyDetails.roleAgent')
                      : property.owner.role === 'landlord'
                        ? t('propertyDetails.roleLandlord')
                        : t('property.owner')}
                </span>
              </span>
              <ChevronRight size={18} color={Colors.neutral[400]} aria-hidden="true" />
            </button>
            {!isOwner && (
              hasActiveBooking ? (
                <div className="pd-owner-actions">
                  <button
                    type="button"
                    className="pd-btn pd-btn-primary"
                    onClick={() => navigate(`/chat/${property.owner_id}?propertyId=${property.id}`)}
                  >
                    <MessageCircle size={16} aria-hidden="true" />
                    {t('propertyDetails.messageAgent')}
                  </button>
                </div>
              ) : (
                <p className="pd-hint">{t('propertyDetails.bookToContact')}</p>
              )
            )}
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
            <ListItemSkeleton count={2} leading="avatar" lines={3} flush />
          ) : propertyReviews.length === 0 ? (
            <div style={{ border: `1px solid ${Colors.neutral[100]}`, backgroundColor: Colors.white }}>
              <EmptyState compact icon={Star} title={t('propertyDetails.reviewsEmptyTitle')} body={t('propertyDetails.reviewsEmptyBody')} />
            </div>
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

              <div className="detail-reviews-grid">
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
        paymentElapsed={paymentStartedAt !== null ? paymentElapsed : null}
        closeLocked={paymentLocked}
      />
      </div>
    </>
  )
}
