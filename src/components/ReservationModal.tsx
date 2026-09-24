import React, { useState, useEffect } from 'react'
import { X, CreditCard, Shield, AlertCircle } from 'lucide-react'
import { useLanguage } from '@/contexts/I18nContext'
import { useBottomSheet } from '@/contexts/BottomSheetContext'
import { getColors } from '@/constants/Colors'
import { useThemeMode } from '@/contexts/ThemeContext'
import { formatPrice } from '@/utils/shareUtils'
import './ReservationModal.css'

// Mobile-money approvals in Cameroon routinely take 30-90 s, and a prompt can
// fail to arrive at all. The booking page keeps waiting (and keeps this modal
// open) for at least this long before treating a payment as failed.
export const PAYMENT_MIN_WAIT_SECONDS = 120
// Manual approval codes when the PIN prompt never appears.
const USSD_FALLBACK = { mtn: '*126#', orange: '#150*50#' } as const
const formatClock = (seconds: number) => {
  const safe = Math.max(0, Math.floor(seconds))
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`
}

interface ReservationModalProps {
  visible: boolean
  onClose: () => void
  onConfirm: () => void
  totalFee: number
  propertyTitle: string
  selectedPaymentMethod: 'mtn' | 'orange' | null
  onPaymentMethodSelect: (method: 'mtn' | 'orange') => void
  phoneNumber: string
  onPhoneNumberChange: (phone: string) => void
  loading: boolean
  message: string | null
  /** Seconds since the payment request was sent; null when not waiting. */
  paymentElapsed?: number | null
  /** True during the minimum wait - the modal can't be closed. */
  closeLocked?: boolean
}

export default function ReservationModal({
  visible,
  onClose,
  onConfirm,
  totalFee,
  propertyTitle,
  selectedPaymentMethod,
  onPaymentMethodSelect,
  phoneNumber,
  onPhoneNumberChange,
  loading,
  message,
  paymentElapsed = null,
  closeLocked = false,
}: ReservationModalProps) {
  const { colorScheme } = useThemeMode()
  const Colors = getColors(colorScheme)
  const { t } = useLanguage()
  const { setBottomSheetOpen } = useBottomSheet()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (visible) {
      document.body.style.overflow = 'hidden'
      setBottomSheetOpen(isMobile) // Only hide nav on mobile when bottom sheet
    } else {
      document.body.style.overflow = 'unset'
      setBottomSheetOpen(false)
    }
    return () => {
      document.body.style.overflow = 'unset'
      setBottomSheetOpen(false)
    }
  }, [visible, isMobile, setBottomSheetOpen])

  if (!visible) return null

  const waiting = paymentElapsed !== null && !!selectedPaymentMethod
  const ussdCode = selectedPaymentMethod === 'orange' ? USSD_FALLBACK.orange : USSD_FALLBACK.mtn
  // Android browsers can open the dialer with a USSD code; iOS and desktop can't.
  const canDial = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent)
  const requestClose = () => {
    if (!closeLocked) onClose()
  }

  return (
    <div className={`reservation-modal-overlay ${isMobile ? 'mobile' : ''}`} onClick={requestClose}>
      <div
        className={`reservation-modal-content ${isMobile ? 'bottom-sheet' : ''}`}
        onClick={(e) => e.stopPropagation()}
        style={{ backgroundColor: Colors.white }}
      >
        {/* Header */}
        <div className="reservation-modal-header" style={{ borderBottomColor: Colors.neutral[200] }}>
          <h2 style={{ color: Colors.neutral[900] }}>
            {t('propertyDetails.bookSiteVisit')}
          </h2>
          <button
            onClick={requestClose}
            className="reservation-close-button"
            disabled={closeLocked}
            aria-label={t('common.close')}
            style={closeLocked ? { opacity: 0.3, cursor: 'not-allowed' } : undefined}
          >
            <X size={24} color={Colors.neutral[600]} />
          </button>
        </div>

        {/* Content */}
        <div className="reservation-modal-scroll">
          {/* Security Badge */}
          <div className="reservation-security-badge" style={{ backgroundColor: Colors.success[50] }}>
            <Shield size={20} color={Colors.success[600]} />
            <span style={{ color: Colors.success[700] }}>
              {t('reservationModal.securePlatformPayment')}
            </span>
          </div>

          {/* Property Info */}
          <div className="reservation-property-info" style={{ backgroundColor: Colors.neutral[50] }}>
            <h4 style={{ color: Colors.neutral[900] }}>{propertyTitle}</h4>
            <div className="reservation-fee-breakdown">
              <div className="fee-row">
                <span style={{ color: Colors.neutral[600] }}>{t('propertyDetails.reservationFee')}</span>
                <span style={{ color: Colors.neutral[900], fontWeight: '700' }}>{formatPrice(totalFee)}</span>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="reservation-section">
            <h3 className="reservation-section-title" style={{ color: Colors.neutral[900] }}>
              {t('propertyDetails.selectPaymentMethod')}
            </h3>
            <div className="reservation-payment-methods">
              <button
                className={`reservation-payment-method ${selectedPaymentMethod === 'mtn' ? 'selected' : ''}`}
                onClick={() => onPaymentMethodSelect('mtn')}
                style={{
                  borderColor: selectedPaymentMethod === 'mtn' ? Colors.primary[600] : Colors.neutral[300],
                  backgroundColor: selectedPaymentMethod === 'mtn' ? Colors.primary[50] : Colors.white,
                }}
              >
                <img src="/mtn-logo.svg" alt="MTN Mobile Money" style={{ width: '40px', height: '40px' }} />
                <span style={{
                  color: selectedPaymentMethod === 'mtn' ? Colors.primary[700] : Colors.neutral[900],
                  fontWeight: selectedPaymentMethod === 'mtn' ? '600' : '500'
                }}>
                  MTN Mobile Money
                </span>
              </button>
              <button
                className={`reservation-payment-method ${selectedPaymentMethod === 'orange' ? 'selected' : ''}`}
                onClick={() => onPaymentMethodSelect('orange')}
                style={{
                  borderColor: selectedPaymentMethod === 'orange' ? Colors.primary[600] : Colors.neutral[300],
                  backgroundColor: selectedPaymentMethod === 'orange' ? Colors.primary[50] : Colors.white,
                }}
              >
                <img src="/orange-logo.svg" alt="Orange Money" style={{ width: '40px', height: '40px' }} />
                <span style={{
                  color: selectedPaymentMethod === 'orange' ? Colors.primary[700] : Colors.neutral[900],
                  fontWeight: selectedPaymentMethod === 'orange' ? '600' : '500'
                }}>
                  Orange Money
                </span>
              </button>
            </div>
          </div>

          {/* Phone Number */}
          <div className="reservation-section">
            <h3 className="reservation-section-title" style={{ color: Colors.neutral[900] }}>
              {t('propertyDetails.phoneNumber')}
            </h3>
            <input
              type="tel"
              className="reservation-input"
              placeholder={t('propertyDetails.enterPhoneNumber')}
              value={phoneNumber}
              onChange={(e) => onPhoneNumberChange(e.target.value)}
              style={{
                borderColor: Colors.neutral[300],
                color: Colors.neutral[900],
                backgroundColor: colorScheme === 'dark' ? Colors.neutral[200] : Colors.white
              }}
            />
            <p className="reservation-input-hint" style={{ color: Colors.neutral[500] }}>
              {t('reservationModal.phoneHint')}
            </p>
          </div>

          {/* Message */}
          {message && (
            <div 
              className="reservation-message" 
              style={{ 
                backgroundColor: loading ? Colors.primary[50] : Colors.warning[50],
                color: loading ? Colors.primary[700] : Colors.warning[700]
              }}
            >
              <AlertCircle size={16} />
              <span>{message}</span>
            </div>
          )}

          {/* Waiting for the customer to approve on their phone */}
          {waiting && (
            <div
              className="reservation-message"
              role="status"
              aria-live="polite"
              style={{ backgroundColor: Colors.primary[50], color: Colors.neutral[800], flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}
            >
              <strong style={{ color: Colors.neutral[900] }}>{t('payment.confirmOnPhoneTitle')}</strong>
              <span>{t('payment.confirmOnPhoneBody', { amount: formatPrice(totalFee), phone: phoneNumber })}</span>
              <span style={{ color: Colors.primary[700], fontWeight: 700, fontSize: 12 }}>
                {t('payment.waitingFor', { time: formatClock(paymentElapsed ?? 0) })}
              </span>
              <strong style={{ color: Colors.neutral[900], marginTop: 4 }}>{t('payment.noPromptTitle')}</strong>
              <span>
                {selectedPaymentMethod === 'orange'
                  ? t('payment.orangeInstruction', { code: ussdCode })
                  : t('payment.mtnInstruction', { code: ussdCode })}
              </span>
              {canDial && (
                <a
                  href={`tel:${encodeURIComponent(ussdCode)}`}
                  style={{ color: Colors.primary[700], fontWeight: 700 }}
                >
                  {t('payment.dialCode', { code: ussdCode })}
                </a>
              )}
              <span style={{ fontSize: 12, color: Colors.neutral[600] }}>
                {closeLocked
                  ? t('payment.keepOpen', { time: formatClock(PAYMENT_MIN_WAIT_SECONDS - (paymentElapsed ?? 0)) })
                  : t('payment.canCloseNow')}
              </span>
            </div>
          )}

          {/* Info Note */}
          <div className="reservation-info-note" style={{ backgroundColor: Colors.primary[50] }}>
            <p style={{ color: Colors.primary[700] }}>
              {t('reservationModal.securePlatformPayment')}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="reservation-modal-footer" style={{ borderTopColor: Colors.neutral[200] }}>
          <button
            onClick={requestClose}
            className="reservation-button reservation-button-outline"
            style={{
              borderColor: Colors.neutral[300],
              color: Colors.neutral[700]
            }}
            disabled={closeLocked || (loading && !waiting)}
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={onConfirm}
            className="reservation-button reservation-button-primary"
            disabled={loading || !selectedPaymentMethod || !phoneNumber}
            style={{
              backgroundColor: loading || !selectedPaymentMethod || !phoneNumber 
                ? Colors.neutral[400] 
                : Colors.primary[700],
              cursor: loading || !selectedPaymentMethod || !phoneNumber 
                ? 'not-allowed' 
                : 'pointer'
            }}
          >
            {loading ? t('buttons.processing') : t('buttons.payNow')}
          </button>
        </div>
      </div>
    </div>
  )
}
