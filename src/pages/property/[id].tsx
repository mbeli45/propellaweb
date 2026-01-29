import { useState, useMemo, useCallback, useEffect } from 'react'
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
  Play
} from 'lucide-react'
import { useThemeMode } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/I18nContext'
import { getColors } from '@/constants/Colors'
import { useProperty, useSimilarProperties } from '@/hooks/useProperties'
import { useAuth } from '@/contexts/AuthContext'
import { useShare } from '@/hooks/useShare'
import { useReservations } from '@/hooks/useReservations'
import { useFapshiPayment } from '@/hooks/useFapshiPayment'
import { formatPrice, calculateRentPrices } from '@/utils/shareUtils'
import { getPaymentStatus } from '@/lib/fapshi'
import { isVideoUrl, separateMedia, generateVideoThumbnail } from '@/utils/videoUtils'
import PropertyCard from '@/components/PropertyCard'
import ReservationModal from '@/components/ReservationModal'
import VideoPlayer from '@/components/VideoPlayer'
import './PropertyDetail.css'

type PaymentMethod = 'mtn' | 'orange'

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { colorScheme } = useThemeMode()
  const { t } = useLanguage()
  const Colors = getColors(colorScheme)
  const { user } = useAuth()
  const { isSharing, shareProperty } = useShare()
  const { processDirectPayment, loading: paymentLoading } = useFapshiPayment()
  const { createReservation, loading: reservationLoading } = useReservations(user?.id || '')

  const { property, loading, error } = useProperty(id || '')
  const { properties: similarProperties } = useSimilarProperties(
    id || '',
    property?.category || 'standard',
    property?.type || 'rent',
    3
  )

  const [isFavorite, setIsFavorite] = useState(false)
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0)
  const [showReservationModal, setShowReservationModal] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [waitingForPayment, setWaitingForPayment] = useState(false)
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null)
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
            thumbnails[videoUrl] = thumbnail
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
    try {
      setWaitingForPayment(true)
      setPaymentMessage(t('buttons.processing'))
      
      const { transId } = await processDirectPayment(
        totalFee,
        user.id,
        phoneNumber,
        { 
          message: `Reservation for ${property.title}`, 
          externalId: property.id,
          name: user.full_name || undefined,
          email: user.email || undefined,
          medium: selectedPaymentMethod === 'orange' ? 'orange money' : 'mobile money'
        }
      )
      
      setPaymentMessage(t('wallet.waitingForPayment'))
      
      // Poll payment status
      let status = null
      let attempts = 0
      while (attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 3000))
        try {
          const result = await getPaymentStatus(transId)
          status = result.status
          if (status === 'SUCCESSFUL') {
            break
          }
          if (status === 'FAILED' || status === 'EXPIRED') {
            setPaymentMessage(t('wallet.paymentFailed'))
            setWaitingForPayment(false)
            return
          }
        } catch (err) {
          console.error('Error checking payment status:', err)
        }
        attempts++
      }

      if (status === 'SUCCESSFUL') {
        // Create reservation
        const today = new Date()
        const reservationDate = new Date(today)
        reservationDate.setDate(today.getDate() + 1)
        
        await createReservation(
          property.id,
          reservationDate.toISOString().split('T')[0],
          null,
          {
            status: 'confirmed',
            amount: totalFee,
            transaction_id: transId,
            payment_status: 'paid',
            paid_at: new Date().toISOString()
          }
        )
        
        setPaymentMessage(t('reservations.reservationCreated'))
        setTimeout(() => {
          closeModal()
          navigate('/user/reservations')
        }, 2000)
      } else {
        setPaymentMessage(t('wallet.paymentTimeout'))
        setWaitingForPayment(false)
      }
    } catch (error: any) {
      console.error('Reservation error:', error)
      setPaymentMessage(error.message || t('reservations.reservationCreationFailed'))
      setWaitingForPayment(false)
    }
  }

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

  const isOwner = user?.id === property.owner_id

  return (
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
      </div>

      {/* Media Gallery (Videos + Images) */}
      {allMedia.length > 0 && (
        <div className="property-images">
          <div className="main-image-container">
            {playingVideo === allMedia[currentMediaIndex] ? (
              <VideoPlayer
                src={allMedia[currentMediaIndex]}
                thumbnail={videoThumbnails[allMedia[currentMediaIndex]]}
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
                <img
                  src={videoThumbnails[allMedia[currentMediaIndex]] || allMedia[currentMediaIndex]}
                  alt={property.title}
                  className="main-image"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
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
                    <img 
                      src={thumbnail || media} 
                      alt={`${property.title} ${idx + 1}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
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
          <span>{property.location}</span>
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

        {/* Similar Properties */}
        {similarProperties.length > 0 && (
          <div style={{ marginTop: '40px' }}>
            <h3 style={{ 
              fontSize: '20px', 
              fontWeight: '600', 
              color: Colors.neutral[900],
              marginBottom: '16px'
            }}>
              {t('property.similarProperties')}
            </h3>
            <div className="property-grid">
              {similarProperties.map((prop) => (
                <PropertyCard key={prop.id} property={prop} />
              ))}
            </div>
          </div>
        )}
      </div>

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
          onClick={() => setIsFavorite(!isFavorite)}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            border: `1px solid ${Colors.neutral[200]}`,
            backgroundColor: Colors.white,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
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
            fill={isFavorite ? Colors.primary[800] : 'transparent'} 
          />
        </button>
        {!isOwner && (
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
  )
}
