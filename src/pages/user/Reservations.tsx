import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useThemeMode } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/I18nContext'
import { useDialog } from '@/contexts/DialogContext'
import { getColors } from '@/constants/Colors'
import { useReservations } from '@/hooks/useReservations'
import { useFapshiPayment } from '@/hooks/useFapshiPayment'
import { useBadgeCounts } from '@/hooks/useBadgeCounts'
import { Calendar, Clock, MapPin, AlertCircle, CreditCard, CheckCircle2, X } from 'lucide-react'
import { formatPrice } from '@/utils/shareUtils'
import PropertyCard from '@/components/PropertyCard'
import './Reservations.css'

export default function UserReservations() {
  const { user } = useAuth()
  const { colorScheme } = useThemeMode()
  const { t } = useLanguage()
  const { confirm, alert } = useDialog()
  const Colors = getColors(colorScheme)
  const navigate = useNavigate()

  const {
    reservations,
    loading,
    error,
    cancelReservation,
    requestRefund,
    refreshReservations,
  } = useReservations(user?.id || '')

  const { clearReservationBadge } = useBadgeCounts(user?.id || '', user?.role)
  const { isMonitoring, monitoringProgress, currentStatus, timeRemaining } = useFapshiPayment()

  const [requestingRefund, setRequestingRefund] = useState<string | null>(null)

  useEffect(() => {
    if (user?.id) {
      clearReservationBadge()
      refreshReservations()
    }
  }, [user?.id, clearReservationBadge, refreshReservations])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return Colors.success[600]
      case 'pending':
        return Colors.warning[600]
      case 'cancelled':
        return Colors.error[600]
      case 'completed':
        return Colors.primary[600]
      default:
        return Colors.neutral[600]
    }
  }

  const getStatusLabel = (status: string) => {
    return t(`reservations.${status}`) || status
  }

  const handleCancel = async (reservationId: string) => {
    const confirmed = await confirm({
      title: t('reservations.cancelReservation') || 'Cancel Reservation',
      message: t('reservations.cancelReservationMessage') || 'Are you sure you want to cancel this reservation?',
      variant: 'warning',
    })
    
    if (!confirmed) return
    
    try {
      await cancelReservation(reservationId)
      alert(t('reservations.reservationCancelledSuccess') || 'Reservation cancelled successfully', 'success')
      refreshReservations()
    } catch (error: any) {
      alert(error.message || t('reservations.failedToCancelReservationMessage') || 'Failed to cancel reservation', 'error')
    }
  }

  const handleRequestRefund = async (reservationId: string) => {
    const confirmed = await confirm({
      title: t('reservations.requestRefund') || 'Request Refund',
      message: t('reservations.requestRefundConfirmMessage') || t('reservations.requestRefundMessage') || 'Are you sure you want to request a refund for this reservation?',
      variant: 'warning',
    })
    
    if (!confirmed) return
    
    setRequestingRefund(reservationId)
    try {
      await requestRefund(reservationId)
      alert(t('reservations.refundRequestedMessage') || 'Refund requested successfully', 'success')
      refreshReservations()
    } catch (error: any) {
      alert(error.message || t('reservations.failedToRequestRefundMessage') || 'Failed to request refund', 'error')
    } finally {
      setRequestingRefund(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (timeString: string | null) => {
    if (!timeString) return ''
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="reservations-container" style={{ backgroundColor: Colors.neutral[50], minHeight: '100vh' }}>
      <div style={{ padding: '20px 16px' }}>
        <h1 style={{ 
          fontSize: '24px', 
          fontWeight: '700', 
          color: Colors.neutral[900],
          marginBottom: '4px'
        }}>
          {t('reservations.title')}
        </h1>
        <p style={{ 
          fontSize: '14px', 
          color: Colors.neutral[600],
          marginBottom: '20px'
        }}>
          {t('reservations.myReservations')}
        </p>
      </div>

      {/* Payment Monitoring */}
      {isMonitoring && (
        <div style={{
          margin: '0 16px 20px',
          padding: '16px',
          backgroundColor: Colors.primary[50],
          borderRadius: '12px',
          border: `1px solid ${Colors.primary[200]}`
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px'
          }}>
            <span style={{
              fontSize: '14px',
              fontWeight: '600',
              color: Colors.primary[800]
            }}>
              {t('reservations.paymentMonitoring')}
            </span>
            <span style={{
              fontSize: '12px',
              fontWeight: '600',
              color: Colors.primary[700],
              backgroundColor: Colors.primary[100],
              padding: '4px 8px',
              borderRadius: '4px'
            }}>
              {currentStatus}
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '6px',
            backgroundColor: Colors.primary[200],
            borderRadius: '3px',
            overflow: 'hidden',
            marginBottom: '12px'
          }}>
            <div style={{
              width: `${monitoringProgress}%`,
              height: '100%',
              backgroundColor: Colors.primary[600],
              borderRadius: '3px',
              transition: 'width 0.3s'
            }} />
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: Colors.primary[700]
          }}>
            <span>{t('reservations.automaticallyChecking')}</span>
            <span>{Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}</span>
          </div>
        </div>
      )}

      {loading && (
        <div style={{ padding: '40px', textAlign: 'center', color: Colors.neutral[600] }}>
          {t('common.loading')}...
        </div>
      )}

      {error && (
        <div style={{ padding: '40px', textAlign: 'center', color: Colors.error[600] }}>
          {error}
        </div>
      )}

      {!loading && !error && reservations.length === 0 && (
        <div style={{
          padding: '48px 24px',
          textAlign: 'center',
          backgroundColor: Colors.white,
          margin: '0 16px',
          borderRadius: '12px'
        }}>
          <Calendar size={64} color={Colors.neutral[400]} style={{ marginBottom: '16px' }} />
          <h2 style={{ color: Colors.neutral[800], marginBottom: '8px' }}>
            {t('reservations.noReservations')}
          </h2>
          <p style={{ color: Colors.neutral[600] }}>
            {t('home.welcomeSubtext')}
          </p>
        </div>
      )}

      {!loading && !error && reservations.length > 0 && (
        <div className="reservations-list">
          {reservations.map((reservation) => {
            const property = reservation.property
            if (!property) return null

            return (
              <div
                key={reservation.id}
                className="reservation-card"
                style={{
                  backgroundColor: Colors.white,
                  borderRadius: '12px',
                  padding: '20px',
                  margin: '0 16px 16px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
                }}
              >
                {/* Property Info */}
                {property && (
                  <div style={{ marginBottom: '16px' }}>
                    <PropertyCard 
                      property={{
                        id: property.id,
                        title: property.title,
                        price: property.price,
                        location: property.location,
                        image: property.images?.[0] || '',
                        images: property.images || [],
                        type: 'rent',
                        category: 'standard',
                        bedrooms: property.bedrooms || undefined,
                        bathrooms: property.bathrooms || undefined,
                        area: property.area || undefined,
                        owner_id: '',
                      }}
                      horizontal
                    />
                  </div>
                )}

                {/* Reservation Details */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px',
                  marginBottom: '16px',
                  padding: '16px',
                  backgroundColor: Colors.neutral[50],
                  borderRadius: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={18} color={Colors.primary[600]} />
                    <div>
                      <div style={{ fontSize: '12px', color: Colors.neutral[600] }}>
                        {t('reservations.reservationDate')}
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: Colors.neutral[900] }}>
                        {formatDate(reservation.reservation_date)}
                      </div>
                    </div>
                  </div>
                  {reservation.reservation_time && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Clock size={18} color={Colors.primary[600]} />
                      <div>
                        <div style={{ fontSize: '12px', color: Colors.neutral[600] }}>
                          Time
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: Colors.neutral[900] }}>
                          {formatTime(reservation.reservation_time)}
                        </div>
                      </div>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CreditCard size={18} color={Colors.primary[600]} />
                    <div>
                      <div style={{ fontSize: '12px', color: Colors.neutral[600] }}>
                        {t('wallet.amount')}
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: Colors.neutral[900] }}>
                        {formatPrice(reservation.amount || 0)} FCFA
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                  padding: '12px',
                  backgroundColor: Colors.neutral[50],
                  borderRadius: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: `${getStatusColor(reservation.status)}20`,
                      color: getStatusColor(reservation.status)
                    }}>
                      {getStatusLabel(reservation.status)}
                    </span>
                  </div>
                  {reservation.payment_status && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {reservation.payment_status === 'paid' ? (
                        <CheckCircle2 size={16} color={Colors.success[600]} />
                      ) : (
                        <AlertCircle size={16} color={Colors.warning[600]} />
                      )}
                      <span style={{
                        fontSize: '12px',
                        color: Colors.neutral[600]
                      }}>
                        {reservation.payment_status === 'paid' ? t('reservations.confirmed') : t('reservations.pending')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  flexWrap: 'wrap'
                }}>
                  {reservation.status === 'pending' && (
                    <button
                      onClick={() => handleCancel(reservation.id)}
                      style={{
                        padding: '10px 16px',
                        backgroundColor: Colors.error[50],
                        color: Colors.error[700],
                        border: `1px solid ${Colors.error[200]}`,
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <X size={16} />
                      {t('reservations.cancel')}
                    </button>
                  )}
                  {reservation.status === 'cancelled' && reservation.payment_status === 'paid' && (
                    <button
                      onClick={() => handleRequestRefund(reservation.id)}
                      disabled={requestingRefund === reservation.id}
                      style={{
                        padding: '10px 16px',
                        backgroundColor: Colors.warning[50],
                        color: Colors.warning[700],
                        border: `1px solid ${Colors.warning[200]}`,
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: requestingRefund === reservation.id ? 'not-allowed' : 'pointer',
                        opacity: requestingRefund === reservation.id ? 0.6 : 1
                      }}
                    >
                      {requestingRefund === reservation.id 
                        ? t('common.loading') 
                        : t('reservations.requestRefund')
                      }
                    </button>
                  )}
                  <button
                    onClick={() => navigate(`/property/${property.id}`)}
                    style={{
                      padding: '10px 16px',
                      backgroundColor: Colors.primary[600],
                      color: Colors.white,
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    {t('property.viewOnMap') || 'View Property'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
