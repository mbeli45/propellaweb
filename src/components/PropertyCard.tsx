import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, BedDouble, Bath, Share2, Edit, Trash2, Play, ShieldCheck } from 'lucide-react'
import { useThemeMode } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/I18nContext'
import { getColors } from '@/constants/Colors'
import { calculateRentPrices, formatPrice as formatPriceUtil } from '@/utils/shareUtils'
import { useShare } from '@/hooks/useShare'
import { isVideoUrl } from '@/utils/videoUtils'
import { formatLastVerified, isAvailabilityStale } from '@/hooks/usePropertyAvailability'
import './PropertyCard.css'

export interface PropertyData {
  id: string
  title: string
  price: number
  location: string
  town?: string // Town/city where property is located (e.g., Yaoundé, Douala, Buea)
  image: string
  images?: string[]
  type: 'rent' | 'sale'
  property_type?: string | null
  bedrooms?: number
  bathrooms?: number
  area?: number
  category: 'budget' | 'standard' | 'premium' | 'luxury'
  isVerified?: boolean
  description?: string
  amenities?: string[]
  reservationFee?: number
  advance_months_min?: number
  advance_months_max?: number
  rent_period?: 'monthly' | 'yearly' | null
  status?: string
  /** Last time the owner confirmed the listing is still on the market. */
  availability_confirmed_at?: string | null
  owner_id: string
  owner?: {
    id: string
    full_name?: string
    avatar_url?: string
    phone?: string
    email?: string
    role?: string
  }
}


interface PropertyCardProps {
  property: PropertyData
  horizontal?: boolean
  isOwner?: boolean
  onEdit?: () => void
  onDelete?: () => void
  onShare?: () => void
  onRemoveSaved?: () => void // Shown on the Saved properties page to unsave
  /** Owner-only: re-confirm the listing is still on the market. */
  onConfirmAvailability?: () => void
  confirmingAvailability?: boolean
  onClick?: () => void
  source?: string
}

export default function PropertyCard({
  property,
  horizontal = false,
  isOwner = false,
  onEdit,
  onDelete,
  onShare,
  onRemoveSaved,
  onConfirmAvailability,
  confirmingAvailability = false,
  onClick,
}: PropertyCardProps) {
  const { colorScheme } = useThemeMode()
  const { t, currentLanguage } = useLanguage()
  const Colors = getColors(colorScheme)
  const navigate = useNavigate()
  const { shareProperty } = useShare()

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      navigate(`/property/${property.id}`)
    }
  }

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onShare) {
      onShare()
    } else {
      await shareProperty(property)
    }
  }

  const displayMedia = useMemo(() => {
    const candidates = [
      ...(property.images || []),
      ...(property.image ? [property.image] : []),
    ]
    const firstImage = candidates.find((url) => url && !isVideoUrl(url))
    if (firstImage) return { url: firstImage, isVideo: false }
    const firstVideo = candidates.find((url) => url && isVideoUrl(url))
    if (firstVideo) return { url: firstVideo, isVideo: true }
    return { url: '/placeholder-property.jpg', isVideo: false }
  }, [property.image, property.images])

  const getCategoryColor = useMemo(() => {
    switch (property.category) {
      case 'budget':
        return Colors.neutral[600]
      case 'standard':
        return Colors.primary[800]
      case 'premium':
        return Colors.success[700]
      case 'luxury':
        return Colors.error[700]
      default:
        return Colors.neutral[600]
    }
  }, [property.category, Colors])

  return (
    <div
      className={`property-card ${horizontal ? 'horizontal' : ''}`}
      onClick={handleClick}
      style={{
        backgroundColor: Colors.white,
        borderRadius: '16px',
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: colorScheme === 'dark' 
          ? '0 2px 8px rgba(0, 0, 0, 0.3)' 
          : '0 2px 8px rgba(0, 0, 0, 0.08)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = colorScheme === 'dark'
          ? '0 4px 12px rgba(0, 0, 0, 0.4)'
          : '0 4px 12px rgba(0, 0, 0, 0.12)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = colorScheme === 'dark'
          ? '0 2px 8px rgba(0, 0, 0, 0.3)'
          : '0 2px 8px rgba(0, 0, 0, 0.08)'
      }}
    >
      <div
        className="property-card-image-container"
        style={{
          position: 'relative',
          height: horizontal ? '120px' : '200px',
          overflow: 'hidden',
        }}
      >
        {displayMedia.isVideo ? (
          <>
            <video
              src={`${displayMedia.url}#t=0.5`}
              className="property-card-image"
              preload="metadata"
              muted
              playsInline
              poster="/placeholder-property.jpg"
            />
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: horizontal ? '40px' : '52px',
                height: horizontal ? '40px' : '52px',
                borderRadius: '50%',
                backgroundColor: 'rgba(0, 0, 0, 0.55)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2,
                pointerEvents: 'none',
              }}
            >
              <Play size={horizontal ? 18 : 24} color="#FFFFFF" fill="#FFFFFF" />
            </div>
          </>
        ) : (
          <img
            src={displayMedia.url}
            alt={property.title}
            className="property-card-image"
            loading="lazy"
            decoding="async"
            onError={(e) => {
              e.currentTarget.src = '/placeholder-property.jpg'
            }}
          />
        )}
        {/* Gradient Overlay */}
        <div className="property-card-gradient-overlay" />
        
        {/* Badges Row */}
        <div
          className="property-card-badges"
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
            // Leave room for the action row (badge + up to three buttons).
            maxWidth: 'calc(100% - 150px)',
            zIndex: 3,
          }}
        >
          {/* Status Badge - Only show for owner */}
          {isOwner && property.status && (
            <span
              style={{
                backgroundColor: property.status === 'reserved' 
                  ? Colors.warning[600] 
                  : property.status === 'sold' 
                  ? Colors.error[600] 
                  : property.status === 'available'
                  ? Colors.success[600]
                  : Colors.success[600],
                color: '#FFFFFF',
                fontSize: horizontal ? '10px' : '11px',
                fontWeight: '600',
                padding: horizontal ? '3px 8px' : '4px 10px',
                borderRadius: '20px',
                textTransform: 'capitalize',
                whiteSpace: 'nowrap',
              }}
            >
              {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
            </span>
          )}
          
          {/* Category Badge */}
          <span
            style={{
              backgroundColor: getCategoryColor,
              color: '#FFFFFF',
              fontSize: horizontal ? '10px' : '11px',
              fontWeight: '600',
              padding: horizontal ? '3px 8px' : '4px 10px',
              borderRadius: '20px',
              textTransform: 'capitalize',
              whiteSpace: 'nowrap',
            }}
          >
            {(property.category || 'standard').charAt(0).toUpperCase() + (property.category || 'standard').slice(1)}
          </span>
          
          {/* Type Badge (For Rent/For Sale) */}
          <span
            style={{
              backgroundColor: Colors.primary[700],
              color: '#FFFFFF',
              fontSize: horizontal ? '10px' : '11px',
              fontWeight: '600',
              padding: horizontal ? '3px 8px' : '4px 10px',
              borderRadius: '20px',
              whiteSpace: 'nowrap',
            }}
          >
            {property.type === 'rent' ? t('property.forRent') : t('property.forSale')}
          </span>
        </div>
        
        {/* Watermark */}
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            right: '10px',
            opacity: 0.3,
            zIndex: 1,
            pointerEvents: 'none',
          }}
        >
          <img
            src="/watermark-logo.png"
            alt="Propella"
            style={{
              width: '40px',
              height: '40px',
            }}
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        </div>
        <div
          className="property-card-actions"
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: 3,
          }}
        >
          {/* Verified Badge - Only show for non-owners. Lives in the action row so
              it never overlaps the buttons, however many of them are rendered. */}
          {property.isVerified && !isOwner && (
            <div className="property-card-verified-badge">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M4.5 7L6.5 9L9.5 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          )}
          {isOwner && (
            <>
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit()
                  }}
                  style={{
                    backgroundColor: colorScheme === 'dark' 
                      ? 'rgba(24, 24, 27, 0.9)' 
                      : 'rgba(255, 255, 255, 0.9)',
                    border: 'none',
                    borderRadius: '20px',
                    padding: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: colorScheme === 'dark'
                      ? '0 1px 2px rgba(0, 0, 0, 0.3)'
                      : '0 1px 2px rgba(0, 0, 0, 0.1)',
                  }}
                  title={t('common.edit') || 'Edit'}
                >
                  <Edit size={18} color={Colors.primary[600]} />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete()
                  }}
                  style={{
                    backgroundColor: colorScheme === 'dark' 
                      ? 'rgba(24, 24, 27, 0.9)' 
                      : 'rgba(255, 255, 255, 0.9)',
                    border: 'none',
                    borderRadius: '20px',
                    padding: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: colorScheme === 'dark'
                      ? '0 1px 2px rgba(0, 0, 0, 0.3)'
                      : '0 1px 2px rgba(0, 0, 0, 0.1)',
                  }}
                  title={t('common.delete') || 'Delete'}
                >
                  <Trash2 size={18} color={Colors.error[600]} />
                </button>
              )}
            </>
          )}
          {onRemoveSaved && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onRemoveSaved()
              }}
              style={{
                backgroundColor: colorScheme === 'dark'
                  ? 'rgba(24, 24, 27, 0.9)'
                  : 'rgba(255, 255, 255, 0.9)',
                border: 'none',
                borderRadius: '20px',
                padding: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: colorScheme === 'dark'
                  ? '0 1px 2px rgba(0, 0, 0, 0.3)'
                  : '0 1px 2px rgba(0, 0, 0, 0.1)',
              }}
              title={t('saved.removeFromSaved')}
              aria-label={t('saved.removeFromSaved')}
            >
              <Trash2 size={18} color={Colors.error[600]} />
            </button>
          )}
          <button
            onClick={handleShare}
            style={{
              backgroundColor: colorScheme === 'dark'
                ? 'rgba(24, 24, 27, 0.9)'
                : 'rgba(255, 255, 255, 0.9)',
              border: 'none',
              borderRadius: '20px',
              padding: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: colorScheme === 'dark'
                ? '0 1px 2px rgba(0, 0, 0, 0.3)'
                : '0 1px 2px rgba(0, 0, 0, 0.1)',
            }}
          >
            <Share2 size={18} color={Colors.primary[600]} />
          </button>
        </div>

        {onConfirmAvailability && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onConfirmAvailability()
            }}
            disabled={confirmingAvailability}
            style={{
              position: 'absolute',
              right: '12px',
              bottom: '10px',
              maxWidth: 'calc(100% - 24px)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: '999px',
              border: 'none',
              backgroundColor: isAvailabilityStale(property.availability_confirmed_at)
                ? '#B45309'
                : 'rgba(5, 150, 105, 0.92)',
              color: 'white',
              fontSize: horizontal ? '10px' : '11px',
              fontWeight: 600,
              cursor: confirmingAvailability ? 'default' : 'pointer',
              opacity: confirmingAvailability ? 0.6 : 1,
              zIndex: 4,
            }}
          >
            <ShieldCheck size={12} color="#fff" />
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {isAvailabilityStale(property.availability_confirmed_at)
                ? t('availability.confirmStillAvailable', 'Confirm still available')
                : formatLastVerified(property.availability_confirmed_at, t, currentLanguage)}
            </span>
          </button>
        )}

        {/* Availability freshness - clients need to know the listing has been
            re-confirmed recently, not just that it was posted at some point. */}
        {!onConfirmAvailability && (
        <div
          style={{
            position: 'absolute',
            left: '12px',
            bottom: '10px',
            maxWidth: 'calc(100% - 24px)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '3px 8px',
            borderRadius: '999px',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            zIndex: 3,
          }}
        >
          <ShieldCheck
            size={12}
            color={isAvailabilityStale(property.availability_confirmed_at) ? '#FCD34D' : '#6EE7B7'}
          />
          <span
            style={{
              color: 'white',
              fontSize: horizontal ? '10px' : '11px',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {formatLastVerified(property.availability_confirmed_at, t, currentLanguage)}
          </span>
        </div>
        )}
      </div>

      <div
        className="property-card-info"
        style={{
          padding: horizontal ? '12px' : '20px',
        }}
      >
        {property.type === 'rent' ? (() => {
          const { monthlyPrice, yearlyPrice } = calculateRentPrices(property.price, property.rent_period)
          return (
            <>
              <div
                style={{
                  fontSize: horizontal ? '16px' : '20px',
                  fontWeight: '700',
                  color: Colors.primary[600],
                  marginBottom: '4px',
                }}
              >
                {formatPriceUtil(monthlyPrice)} / {t('propertyCard.month')}
              </div>
              <div
                style={{
                  fontSize: horizontal ? '12px' : '14px',
                  fontWeight: '500',
                  color: Colors.neutral[500],
                  marginBottom: '6px',
                }}
              >
                ({formatPriceUtil(yearlyPrice)} / {t('propertyCard.year')})
              </div>
              {(property.advance_months_min || property.advance_months_max) && (
                <div
                  style={{
                    fontSize: horizontal ? '11px' : '13px',
                    fontWeight: '500',
                    color: Colors.neutral[700],
                    marginBottom: '6px',
                    backgroundColor: Colors.neutral[50],
                    padding: '4px 8px',
                    borderRadius: '8px',
                    display: 'inline-block',
                  }}
                >
                  {t('propertyCard.advance')}: {property.advance_months_min || 6}–{property.advance_months_max || 12} {t('propertyCard.months')}
                </div>
              )}
            </>
          )
        })() : (
          <div
            style={{
              fontSize: horizontal ? '16px' : '20px',
              fontWeight: '700',
              color: Colors.primary[600],
              marginBottom: '4px',
            }}
          >
            {formatPriceUtil(property.price)}
          </div>
        )}

        <h3
          style={{
            fontSize: horizontal ? '14px' : '16px',
            fontWeight: '600',
            color: Colors.neutral[900],
            marginBottom: '6px',
            lineHeight: horizontal ? '18px' : '22px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {property.title || t('propertyCard.untitledProperty')}
        </h3>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: horizontal ? '8px' : '12px',
          }}
        >
          <MapPin size={14} color={Colors.neutral[500]} />
          <span
            style={{
              fontSize: horizontal ? '12px' : '14px',
              color: Colors.neutral[600],
              marginLeft: '6px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
            }}
          >
            {property.town ? `${property.town}, ${property.location}` : (property.location || t('propertyCard.locationNotSpecified'))}
          </span>
        </div>

        <div
          className="property-card-features"
          style={{
            display: 'flex',
            gap: horizontal ? '12px' : '20px',
            alignItems: 'center',
          }}
        >
          {property.bedrooms !== undefined && property.bedrooms !== null && property.bedrooms > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: Colors.neutral[50],
                padding: horizontal ? '3px 6px' : '4px 8px',
                borderRadius: '12px',
                gap: '6px',
              }}
            >
              <BedDouble size={14} color={Colors.primary[700]} />
              <span
                style={{
                  fontSize: horizontal ? '11px' : '13px',
                  color: Colors.neutral[700],
                  fontWeight: '500',
                }}
              >
                {property.bedrooms}
              </span>
            </div>
          )}
          {property.bathrooms !== undefined && property.bathrooms !== null && property.bathrooms > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: Colors.neutral[50],
                padding: horizontal ? '3px 6px' : '4px 8px',
                borderRadius: '12px',
                gap: '6px',
              }}
            >
              <Bath size={14} color={Colors.primary[700]} />
              <span
                style={{
                  fontSize: horizontal ? '11px' : '13px',
                  color: Colors.neutral[700],
                  fontWeight: '500',
                }}
              >
                {property.bathrooms}
              </span>
            </div>
          )}
          {property.area && property.area > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: Colors.neutral[50],
                padding: horizontal ? '3px 6px' : '4px 8px',
                borderRadius: '12px',
              }}
            >
              <span
                style={{
                  fontSize: horizontal ? '11px' : '13px',
                  color: Colors.neutral[700],
                  fontWeight: '500',
                }}
              >
                {property.area} m²
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
