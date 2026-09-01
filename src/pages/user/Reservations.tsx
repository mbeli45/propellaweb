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
import { Calendar, Clock, MapPin, CheckCircle2, X, MessageCircle, Home, ChevronRight } from 'lucide-react'
import { formatPrice } from '@/utils/shareUtils'
import ReviewModal from '@/components/ReviewModal'
import CommissionPaymentModal from '@/components/CommissionPaymentModal'
import './Reservations.css'

// Shared button shapes, so the row reads as one control group rather than four
// unrelated pills.
const actionBase: React.CSSProperties = {
  padding: '9px 14px',
  borderRadius: '8px',
  fontSize: '13px',
  fontWeight: 500,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  border: 'none',
  whiteSpace: 'nowrap',
}

export default function UserReservations() {
  const { user } = useAuth()
  const { colorScheme } = useThemeMode()
  const { t, currentLanguage } = useLanguage()
  const { confirm, alert } = useDialog()
  const Colors = getColors(colorScheme)
  const navigate = useNavigate()

  const {
    reservations,
    loading,
    error,
    cancelReservation,
    completeReservation,
    requestRefund,
    refreshReservations,
  } = useReservations(user?.id || '')

  const { clearReservationBadge } = useBadgeCounts(user?.id || '', user?.role)
  const { isMonitoring, monitoringProgress, currentStatus, timeRemaining } = useFapshiPayment()

  const [requestingRefund, setRequestingRefund] = useState<string | null>(null)
  const [completingVisit, setCompletingVisit] = useState<string | null>(null)
  const [reviewReservation, setReviewReservation] = useState<any>(null)
  const [commissionReservation, setCommissionReservation] = useState<any>(null)

  // Mirrors the mobile gate: a paid, confirmed booking whose visit day has
  // arrived. reservation_date is a DATE, so it parses as UTC midnight - the
  // button appears from the start of the visit day rather than after it.
  // "confirmed" is the booking status; completing is what ends the visit.
  const canCompleteVisit = (reservation: any) =>
    reservation.status === 'confirmed' &&
    new Date() >= new Date(reservation.reservation_date)

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

  // Completing is the action; rating is what you are offered afterwards. The
  // review must never gate completion - that is what kept agents' funds locked.
  const handleCompleteVisit = async (reservation: any) => {
    const confirmed = await confirm({
      title: t('reservations.completeVisitTitle'),
      message: t('reservations.completeVisitMessage'),
      variant: 'info',
    })

    if (!confirmed) return

    setCompletingVisit(reservation.id)
    try {
      await completeReservation(reservation.id)
      refreshReservations()
      // Offer the rating. Declining leaves the visit completed.
      setReviewReservation(reservation)
    } catch (error: any) {
      // The thrown message is a Postgres/PostgREST string, not something to
      // put in front of a visitor in either language.
      console.error('[Reservations] Failed to complete visit', error)
      alert(t('reservations.failedToCompleteVisitMessage'), 'error', t('reservations.errorTitle'))
    } finally {
      setCompletingVisit(null)
    }
  }

  // Submitted or declined, the next step is the same: the commission prompt.
  const handleReviewClosed = () => {
    const reviewed = reviewReservation
    setReviewReservation(null)
    if (reviewed) setCommissionReservation(reviewed)
  }

  // A booked listing is hidden from the public feed, so this row is the only
  // route back to it - and to the agent holding the visit.
  const handleMessageAgent = (reservation: any) => {
    const ownerId = reservation.property?.owner_id
    if (!ownerId) {
      alert(t('reservations.agentUnavailable'), 'error', t('reservations.errorTitle'))
      return
    }
    const propertyId = reservation.property?.id || reservation.property_id
    navigate(propertyId ? `/chat/${ownerId}?propertyId=${propertyId}` : `/chat/${ownerId}`)
  }

  // Date and time were two separate labelled rows; they are one fact.
  const formatVisitSlot = (reservation: any) => {
    const locale = currentLanguage === 'fr' ? 'fr-FR' : 'en-US'
    const date = new Date(reservation.reservation_date).toLocaleDateString(locale, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
    if (!reservation.reservation_time) return date
    const time = new Date(`2000-01-01T${reservation.reservation_time}`).toLocaleTimeString(
      locale,
      { hour: '2-digit', minute: '2-digit' },
    )
    return `${date} · ${time}`
  }

  const secondaryAction: React.CSSProperties = {
    ...actionBase,
    backgroundColor: Colors.primary[50],
    border: `1px solid ${Colors.primary[100]}`,
  }

  const primaryAction: React.CSSProperties = {
    ...actionBase,
    color: Colors.white,
  }

  const ghostAction: React.CSSProperties = {
    ...actionBase,
    backgroundColor: 'transparent',
    border: `1px solid ${Colors.neutral[200]}`,
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
                {/* Header: thumbnail, status, title, location. Tapping it
                    opens the listing - a booked property is out of the public
                    feed, so this row is the only route back to it. */}
                <div
                  onClick={() => property?.id && navigate(`/property/${property.id}`)}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    cursor: property?.id ? 'pointer' : 'default'
                  }}
                >
                  {property?.images?.[0] ? (
                    <img
                      src={property.images[0]}
                      alt={property.title || ''}
                      loading="lazy"
                      style={{
                        width: '92px',
                        height: '92px',
                        flexShrink: 0,
                        objectFit: 'cover',
                        borderRadius: '10px',
                        backgroundColor: Colors.neutral[100]
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '92px',
                      height: '92px',
                      flexShrink: 0,
                      borderRadius: '10px',
                      backgroundColor: Colors.neutral[100],
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Home size={26} color={Colors.neutral[400]} />
                    </div>
                  )}

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '3px 10px',
                      borderRadius: '20px',
                      fontSize: '11px',
                      fontWeight: 600,
                      backgroundColor: `${getStatusColor(reservation.status)}1A`,
                      color: getStatusColor(reservation.status)
                    }}>
                      <span style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: getStatusColor(reservation.status)
                      }} />
                      {getStatusLabel(reservation.status)}
                    </span>

                    <div style={{
                      marginTop: '6px',
                      fontSize: '15px',
                      fontWeight: 600,
                      color: Colors.neutral[900],
                      lineHeight: 1.3,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {property?.title || t('reservations.propertyLabel')}
                    </div>

                    <div style={{
                      marginTop: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '12px',
                      color: Colors.neutral[500],
                      minWidth: 0
                    }}>
                      <MapPin size={12} style={{ flexShrink: 0 }} />
                      <span style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {property?.location || t('reservations.locationNotAvailable')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Date, time and amount were three separate rows of pills. */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginTop: '12px',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  backgroundColor: Colors.neutral[100]
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '11px', color: Colors.neutral[500] }}>
                      {t('reservations.reservationDate')}
                    </div>
                    <div style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: Colors.neutral[900],
                      marginTop: '2px'
                    }}>
                      {formatVisitSlot(reservation)}
                    </div>
                  </div>
                  <div style={{
                    width: '1px',
                    alignSelf: 'stretch',
                    backgroundColor: Colors.neutral[200],
                    margin: '0 12px'
                  }} />
                  <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: Colors.neutral[500] }}>
                      {t('reservations.paid')}
                    </div>
                    <div style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: Colors.neutral[900],
                      marginTop: '2px'
                    }}>
                      {/* formatPrice already appends FCFA */}
                      {formatPrice(reservation.amount || 0)}
                    </div>
                  </div>
                </div>

                {/* At most two actions: reaching the agent, and whatever this
                    reservation's status actually allows next. */}
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  marginTop: '12px',
                  flexWrap: 'wrap'
                }}>
                  {property?.owner_id && (
                    <button
                      onClick={() => handleMessageAgent(reservation)}
                      style={{ ...secondaryAction, color: Colors.primary[600] }}
                    >
                      <MessageCircle size={15} />
                      {t('reservations.messageAgent')}
                    </button>
                  )}

                  {canCompleteVisit(reservation) ? (
                    <button
                      onClick={() => handleCompleteVisit(reservation)}
                      disabled={completingVisit === reservation.id}
                      style={{
                        ...primaryAction,
                        backgroundColor: Colors.success[600],
                        cursor: completingVisit === reservation.id ? 'not-allowed' : 'pointer',
                        opacity: completingVisit === reservation.id ? 0.6 : 1
                      }}
                    >
                      <CheckCircle2 size={15} />
                      {completingVisit === reservation.id
                        ? t('common.loading')
                        : t('reservations.completeVisit')}
                    </button>
                  ) : reservation.status === 'pending' ? (
                    <button
                      onClick={() => handleCancel(reservation.id)}
                      style={{ ...ghostAction, color: Colors.error[700] }}
                    >
                      <X size={15} />
                      {t('reservations.cancel')}
                    </button>
                  ) : reservation.status === 'cancelled' && reservation.payment_status === 'paid' ? (
                    <button
                      onClick={() => handleRequestRefund(reservation.id)}
                      disabled={requestingRefund === reservation.id}
                      style={{
                        ...ghostAction,
                        color: Colors.warning[700],
                        cursor: requestingRefund === reservation.id ? 'not-allowed' : 'pointer',
                        opacity: requestingRefund === reservation.id ? 0.6 : 1
                      }}
                    >
                      {requestingRefund === reservation.id
                        ? t('common.loading')
                        : t('reservations.requestRefund')}
                    </button>
                  ) : property?.id ? (
                    <button
                      onClick={() => navigate(`/property/${property.id}`)}
                      style={{ ...ghostAction, color: Colors.neutral[700] }}
                    >
                      {t('reservations.viewProperty')}
                      <ChevronRight size={14} />
                    </button>
                  ) : null}
                </div>

                {/* The visit day has not arrived, so completing is not yet
                    possible. Say so - the agent's fee stays locked until this
                    happens, and silence here reads as a missing button. */}
                {reservation.status === 'confirmed' && !canCompleteVisit(reservation) && (
                  <div style={{
                    marginTop: '10px',
                    fontSize: '12px',
                    color: Colors.neutral[500],
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '6px'
                  }}>
                    <Clock size={13} style={{ flexShrink: 0, marginTop: '1px' }} />
                    <span>{t('reservations.completeAvailableOnVisitDay')}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <ReviewModal
        visible={!!reviewReservation}
        reservation={reviewReservation}
        userId={user?.id || ''}
        onClose={handleReviewClosed}
      />

      {commissionReservation && (
        <CommissionPaymentModal
          visible={!!commissionReservation}
          onClose={() => setCommissionReservation(null)}
          reservation={commissionReservation}
          agentName={commissionReservation.property?.owner?.full_name || t('reservations.agent')}
          propertyTitle={commissionReservation.property?.title || t('reservations.propertyLabel')}
          onPaymentSuccess={() => {
            setCommissionReservation(null)
            refreshReservations()
          }}
        />
      )}
    </div>
  )
}
