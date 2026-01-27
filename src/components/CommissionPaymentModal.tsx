import React, { useState, useEffect } from 'react'
import { X, Shield, DollarSign, Clock, AlertTriangle, CreditCard } from 'lucide-react'
import { useLanguage } from '@/contexts/I18nContext'
import { getColors } from '@/constants/Colors'
import { useThemeMode } from '@/contexts/ThemeContext'
import { useCommissionPayment } from '@/hooks/useCommissionPayment'
import './CommissionPaymentModal.css'

interface CommissionPaymentModalProps {
  visible: boolean
  onClose: () => void
  reservation: any
  agentName: string
  propertyTitle: string
  onPaymentSuccess?: () => void
}

type PaymentMethod = 'mtn' | 'orange'

export default function CommissionPaymentModal({
  visible,
  onClose,
  reservation,
  agentName,
  propertyTitle,
  onPaymentSuccess
}: CommissionPaymentModalProps) {
  const { colorScheme } = useThemeMode()
  const Colors = getColors(colorScheme)
  const { t } = useLanguage()
  
  const [commissionAmount, setCommissionAmount] = useState('')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  
  const { createCommissionPayment, loading } = useCommissionPayment()

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
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [visible])

  if (!visible) return null

  const handlePayCommission = () => {
    setShowPaymentForm(true)
  }

  const handleSkip = () => {
    if (window.confirm(t('commissionPayment.skipConfirmMessage') || 'Are you sure you want to skip paying through the platform?')) {
      onClose()
    }
  }

  const handleConfirmPayment = async () => {
    if (!commissionAmount || !selectedPaymentMethod || !phoneNumber) {
      alert('Please fill in all required fields')
      return
    }

    const amount = parseFloat(commissionAmount)
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid commission amount')
      return
    }

    try {
      await createCommissionPayment(
        reservation.user_id,
        reservation.property?.owner_id,
        reservation.property_id,
        reservation.id,
        amount,
        selectedPaymentMethod,
        phoneNumber
      )
      
      if (onPaymentSuccess) {
        onPaymentSuccess()
      }
      onClose()
    } catch (error: any) {
      alert(error.message || 'Failed to process commission payment')
    }
  }

  const renderPaymentMethod = (method: PaymentMethod, label: string, iconSrc: string) => (
    <button
      key={method}
      className={`payment-method ${selectedPaymentMethod === method ? 'selected' : ''}`}
      onClick={() => setSelectedPaymentMethod(method)}
      style={{
        borderColor: selectedPaymentMethod === method ? Colors.primary[600] : Colors.neutral[300],
        backgroundColor: selectedPaymentMethod === method ? Colors.primary[50] : Colors.white,
      }}
    >
      <div className="payment-method-content">
        <img src={iconSrc} alt={label} style={{ width: '32px', height: '32px' }} />
        <span style={{
          color: selectedPaymentMethod === method ? Colors.primary[700] : Colors.neutral[900],
          fontWeight: selectedPaymentMethod === method ? '600' : '500'
        }}>
          {label}
        </span>
      </div>
    </button>
  )

  const renderMainContent = () => (
    <div className="modal-scroll-content">
      <div className="security-badge" style={{ backgroundColor: Colors.success[50] }}>
        <Shield size={20} color={Colors.success[600]} />
        <span style={{ color: Colors.success[700] }}>
          {t('commissionPayment.securePlatformPayment')}
        </span>
      </div>

      <div className="warning-section" style={{
        backgroundColor: Colors.warning[50],
        borderLeftColor: Colors.warning[400]
      }}>
        <div className="warning-title" style={{ color: Colors.warning[800] }}>
          <AlertTriangle size={16} color={Colors.warning[600]} />
          <span>{t('commissionPayment.importantNotice')}</span>
        </div>
        <p style={{ color: Colors.warning[700] }}>
          {t('commissionPayment.agentMayAsk')}
        </p>
      </div>

      <div className="property-info" style={{ backgroundColor: Colors.neutral[50] }}>
        <h4 style={{ color: Colors.neutral[900] }}>{propertyTitle}</h4>
        <p style={{ color: Colors.neutral[600] }}>Agent: {agentName}</p>
        <p style={{ color: Colors.neutral[600] }}>
          {t('commissionPayment.visitDate', { date: new Date(reservation.reservation_date).toLocaleDateString() })}
        </p>
      </div>

      <h3 className="section-title" style={{ color: Colors.neutral[900] }}>
        {t('commissionPayment.whyPayThroughPlatform')}
      </h3>
      
      <div className="benefits-list">
        <div className="benefit-item">
          <Shield size={16} color={Colors.success[600]} />
          <div>
            <strong>{t('commissionPayment.escrowProtection')}</strong>
            <p>{t('commissionPayment.escrowDescription')}</p>
          </div>
        </div>
        
        <div className="benefit-item">
          <Clock size={16} color={Colors.primary[600]} />
          <div>
            <strong>{t('commissionPayment.safetyPeriod')}</strong>
            <p>{t('commissionPayment.safetyDescription')}</p>
          </div>
        </div>
        
        <div className="benefit-item">
          <AlertTriangle size={16} color={Colors.warning[600]} />
          <div>
            <strong>{t('commissionPayment.disputeResolution')}</strong>
            <p>{t('commissionPayment.disputeDescription')}</p>
          </div>
        </div>
        
        <div className="benefit-item">
          <DollarSign size={16} color={Colors.neutral[600]} />
          <div>
            <strong>{t('commissionPayment.transactionRecords')}</strong>
            <p>{t('commissionPayment.recordsDescription')}</p>
          </div>
        </div>
      </div>

      <div className="button-container">
        <button
          onClick={handleSkip}
          className="button button-outline"
          style={{
            borderColor: Colors.neutral[300],
            color: Colors.neutral[700]
          }}
        >
          {t('commission.skipForNow')}
        </button>
        <button
          onClick={handlePayCommission}
          className="button button-primary"
          style={{ backgroundColor: Colors.primary[700] }}
        >
          {t('commission.paySecurely')}
        </button>
      </div>

      <p className="note-text" style={{ color: Colors.neutral[500] }}>
        {t('commission.youCanAlwaysPayLater')}
      </p>
    </div>
  )

  const renderPaymentForm = () => (
    <div className="modal-scroll-content">
      <h3 className="section-title" style={{ color: Colors.neutral[900] }}>
        {t('commission.commissionAmount')}
      </h3>
      <input
        type="number"
        className="themed-input"
        placeholder={t('form.commissionAmount')}
        value={commissionAmount}
        onChange={(e) => setCommissionAmount(e.target.value)}
        style={{
          borderColor: Colors.neutral[300],
          color: Colors.neutral[900],
          backgroundColor: Colors.white
        }}
      />

      <div className="escrow-info" style={{ backgroundColor: Colors.primary[50] }}>
        <p style={{ color: Colors.primary[700] }}>
          {t('commission.platformFee30')}
        </p>
      </div>

      <h3 className="section-title" style={{ color: Colors.neutral[900] }}>
        {t('commission.paymentMethod')}
      </h3>
      <div className="payment-methods">
        {renderPaymentMethod('mtn', t('commission.mtnMobileMoney'), '/mtn-logo.svg')}
        {renderPaymentMethod('orange', t('commission.orangeMoney'), '/orange-logo.svg')}
      </div>

      <h3 className="section-title" style={{ color: Colors.neutral[900] }}>
        {t('commission.phoneNumber')}
      </h3>
      <input
        type="tel"
        className="themed-input"
        placeholder={t('form.phoneNumberForCommission')}
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
        style={{
          borderColor: Colors.neutral[300],
          color: Colors.neutral[900],
          backgroundColor: Colors.white
        }}
      />

      <div className="button-container">
        <button
          onClick={() => setShowPaymentForm(false)}
          className="button button-outline"
          style={{
            borderColor: Colors.neutral[300],
            color: Colors.neutral[700]
          }}
        >
          {t('commission.back')}
        </button>
        <button
          onClick={handleConfirmPayment}
          className="button button-primary"
          disabled={loading || !commissionAmount || !selectedPaymentMethod || !phoneNumber}
          style={{
            backgroundColor: loading ? Colors.neutral[400] : Colors.primary[700],
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? t('commission.processing') : t('commission.payCommission')}
        </button>
      </div>
    </div>
  )

  return (
    <div className={`modal-overlay ${isMobile ? 'mobile' : ''}`} onClick={onClose}>
      <div
        className={`modal-content ${isMobile ? 'bottom-sheet' : ''}`}
        onClick={(e) => e.stopPropagation()}
        style={{ backgroundColor: Colors.white }}
      >
        <div className="modal-header" style={{ borderBottomColor: Colors.neutral[200] }}>
          <h2 style={{ color: Colors.neutral[900] }}>
            {showPaymentForm ? t('commission.payAgentCommission') : t('commission.agentCommissionPayment')}
          </h2>
          <button onClick={onClose} className="close-button">
            <X size={24} color={Colors.neutral[600]} />
          </button>
        </div>

        {showPaymentForm ? renderPaymentForm() : renderMainContent()}
      </div>
    </div>
  )
}
