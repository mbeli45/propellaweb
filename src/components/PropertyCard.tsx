import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, BedDouble, Bath, Share2 } from 'lucide-react'
import { useThemeMode } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/I18nContext'
import { getColors } from '@/constants/Colors'
import { calculateRentPrices, formatPrice as formatPriceUtil } from '@/utils/shareUtils'
import './PropertyCard.css'

export interface PropertyData {
  id: string
  title: string
  price: number
  location: string
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
  source?: string
}

export default function PropertyCard({
  property,
  horizontal = false,
  isOwner = false,
  onEdit,
  onDelete,
  onShare,
}: PropertyCardProps) {
  const { colorScheme } = useThemeMode()
  const { t } = useLanguage()
  const Colors = getColors(colorScheme)
  const navigate = useNavigate()

  const handleClick = () => {
    navigate(`/property/${property.id}`)
  }

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
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.12)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)'
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
        <img
          src={property.image || property.images?.[0] || '/placeholder-property.jpg'}
          alt={property.title}
          className="property-card-image"
          onError={(e) => {
            e.currentTarget.src = '/placeholder-property.jpg'
          }}
        />
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
            gap: '6px',
            zIndex: 3,
          }}
        >
          {/* Category Badge */}
          <span
            style={{
              backgroundColor: getCategoryColor,
              color: Colors.white,
              fontSize: horizontal ? '10px' : '11px',
              fontWeight: '600',
              padding: horizontal ? '3px 8px' : '4px 10px',
              borderRadius: '20px',
              textTransform: 'capitalize',
            }}
          >
            {(property.category || 'standard').charAt(0).toUpperCase() + (property.category || 'standard').slice(1)}
          </span>
          
          {/* Type Badge (For Rent/For Sale) */}
          <span
            style={{
              backgroundColor: Colors.primary[700],
              color: Colors.white,
              fontSize: horizontal ? '10px' : '11px',
              fontWeight: '600',
              padding: horizontal ? '3px 8px' : '4px 10px',
              borderRadius: '20px',
            }}
          >
            {property.type === 'rent' ? t('property.forRent') : t('property.forSale')}
          </span>
        </div>
        
        {/* Verified Badge */}
        {property.isVerified && (
          <div className="property-card-verified-badge">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M4.5 7L6.5 9L9.5 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}
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
            gap: '8px',
            zIndex: 3,
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (onShare) {
                onShare()
              }
            }}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              border: 'none',
              borderRadius: '20px',
              padding: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
            }}
          >
            <Share2 size={18} color={Colors.primary[700]} />
          </button>
        </div>
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
                  color: Colors.primary[800],
                  marginBottom: '4px',
                }}
              >
                {formatPriceUtil(monthlyPrice)} / {t('propertyCard.month')}
              </div>
              <div
                style={{
                  fontSize: horizontal ? '12px' : '14px',
                  fontWeight: '500',
                  color: Colors.neutral[600],
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
              color: Colors.primary[800],
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
            {property.location || t('propertyCard.locationNotSpecified')}
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
