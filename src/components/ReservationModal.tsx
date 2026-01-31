import React, { useState, useEffect } from 'react'
import { X, CreditCard, Shield, AlertCircle } from 'lucide-react'
import { useLanguage } from '@/contexts/I18nContext'
import { useBottomSheet } from '@/contexts/BottomSheetContext'
import { getColors } from '@/constants/Colors'
import { useThemeMode } from '@/contexts/ThemeContext'
import { formatPrice } from '@/utils/shareUtils'
import './ReservationModal.css'

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
  message
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

  return (
    <div className={`reservation-modal-overlay ${isMobile ? 'mobile' : ''}`} onClick={onClose}>
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
          <button onClick={onClose} className="reservation-close-button">
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
            onClick={onClose}
            className="reservation-button reservation-button-outline"
            style={{
              borderColor: Colors.neutral[300],
              color: Colors.neutral[700]
            }}
            disabled={loading}
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
