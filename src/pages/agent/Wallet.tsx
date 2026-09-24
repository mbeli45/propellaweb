import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useThemeMode } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/I18nContext'
import { useBottomSheet } from '@/contexts/BottomSheetContext'
import { getColors } from '@/constants/Colors'
import { supabase } from '@/lib/supabase'
import { useWallet } from '@/hooks/useWallet'
import { useFapshiWithdrawal } from '@/hooks/useFapshiWithdrawal'
import { ArrowDown, ArrowUp, ArrowUpCircle, CreditCard, X, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { formatPrice } from '@/utils/shareUtils'
import './Wallet.css'
import { ListItemSkeleton } from '@/components/skeletons'
import { CardButton, EmptyState, PageHeader, ReservationsPage } from '@/components/reservations/ReservationUI'

export default function AgentWallet() {
  const { user } = useAuth()
  const { colorScheme } = useThemeMode()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const { setBottomSheetOpen } = useBottomSheet()
  const Colors = getColors(colorScheme)

  const {
    wallet,
    transactions,
    loading,
    error,
    refreshWallet
  } = useWallet(user?.id || '')

  const { processFapshiWithdrawal, loading: withdrawalLoading, error: withdrawalError } = useFapshiWithdrawal(user?.id || '')

  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'mtn' | 'orange' | null>(null)
  const [withdrawalMessage, setWithdrawalMessage] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  // Null while unknown - never 0, which would read as "nothing to withdraw".
  const [availableBalance, setAvailableBalance] = useState<number | null>(null)

  const balance = wallet?.balance || 0
  // Reservation income stays locked until the visitor confirms the visit, so
  // this is usually smaller than the balance. The page used to show `balance`
  // everywhere it said "Available", then the server guard rejected the
  // withdrawal with "Available: 0" and nothing on screen explained why.
  const withdrawable = availableBalance ?? balance
  const hasLockedFunds = availableBalance !== null && availableBalance < balance

  useEffect(() => {
    if (!user?.id) {
      setAvailableBalance(null)
      return
    }
    let cancelled = false
    const loadAvailableBalance = async () => {
      const { data, error } = await supabase
        .rpc('available_withdrawable_balance', { p_user_id: user.id })
      if (cancelled) return
      if (error) {
        console.error('[Wallet] Failed to load available balance', error)
        setAvailableBalance(null)
        return
      }
      // numeric can arrive as a string over PostgREST, and Number(null) is 0.
      const parsed = data === null || data === undefined ? NaN : Number(data)
      setAvailableBalance(Number.isFinite(parsed) ? parsed : null)
    }
    loadAvailableBalance()
    return () => { cancelled = true }
  }, [user?.id, wallet?.balance])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (showWithdrawModal) {
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
  }, [showWithdrawModal, isMobile, setBottomSheetOpen])

  const handleWithdraw = async () => {
    if (!withdrawAmount || !phoneNumber || !selectedPaymentMethod) {
      setWithdrawalMessage(t('wallet.fillAllFields') || 'Please fill all fields')
      return
    }

    const amount = parseFloat(withdrawAmount)
    if (isNaN(amount) || amount <= 0) {
      setWithdrawalMessage(t('wallet.invalidAmount') || 'Please enter a valid amount')
      return
    }

    if (amount > withdrawable) {
      setWithdrawalMessage(
        hasLockedFunds
          ? t('wallet.withdrawalLockedUntilCompleted')
          : t('wallet.insufficientBalance') || 'Insufficient balance'
      )
      return
    }

    try {
      setWithdrawalMessage(null)
      await processFapshiWithdrawal(amount, phoneNumber, selectedPaymentMethod)
      setShowWithdrawModal(false)
      setWithdrawAmount('')
      setPhoneNumber('')
      setSelectedPaymentMethod(null)
      setWithdrawalMessage(null)
      refreshWallet()
    } catch (error: any) {
      setWithdrawalMessage(error.message || t('wallet.withdrawalFailed') || 'Withdrawal failed')
    }
  }

  const closeModal = () => {
    setShowWithdrawModal(false)
    setWithdrawAmount('')
    setPhoneNumber('')
    setSelectedPaymentMethod(null)
    setWithdrawalMessage(null)
  }

  const isIncome = (type: string) => ['deposit', 'payment', 'deal_commission_income'].includes(type)

  return (
    <ReservationsPage narrow label={t('wallet.title')}>
      <PageHeader
        title={t('wallet.title')}
        subtitle={t('wallet.manageEarnings')}
        onBack={() => ((window.history.state?.idx ?? 0) > 0 ? navigate(-1) : navigate('/agent/profile'))}
        backLabel={t('common.back')}
      />

      {/* Balance: the one hero surface on the page */}
      <section className="wl-balance" aria-label={t('wallet.totalBalance')}>
        <span className="wl-label">{t('wallet.totalBalance')}</span>
        <strong className="wl-amount">{formatPrice(balance)}</strong>
        {hasLockedFunds && (
          <div className="rsv-warning" role="note">
            <AlertCircle size={16} aria-hidden="true" />
            <span>
              <strong>{t('wallet.availableForWithdrawal')}: {formatPrice(availableBalance!)}</strong>
              <br />
              {availableBalance === 0 ? t('wallet.allFundsLocked') : t('wallet.someFundsLocked')}
            </span>
          </div>
        )}
        <CardButton
          label={t('wallet.withdraw')}
          icon={ArrowUpCircle}
          tone="primary"
          onClick={() => setShowWithdrawModal(true)}
          disabled={balance <= 0}
          block
        />
      </section>

      <h2 className="ds-section-title">{t('wallet.transactionHistory')}</h2>

      {loading && <ListItemSkeleton count={4} leading="avatar" lines={2} trailing="text" flush />}

      {error && (
        <p role="alert" style={{ color: 'var(--rsv-error)', margin: '12px 0' }}>
          {error}
        </p>
      )}

      {!loading && !error && transactions.length === 0 && (
        <EmptyState icon={CreditCard} title={t('wallet.noTransactions')} />
      )}

      {!loading && !error && transactions.length > 0 && (
        <ul className="wl-list">
          {transactions.map((transaction) => {
            const income = isIncome(transaction.type)
            return (
              <li key={transaction.id} className="wl-row">
                <span className={`wl-icon${income ? ' wl-icon--in' : ''}`} aria-hidden="true">
                  {income ? <ArrowUp size={18} /> : <ArrowDown size={18} />}
                </span>
                <span className="wl-text">
                  <span className="wl-title">
                    {transaction.type === 'deal_commission_income' ? 'Property deal commission' : transaction.type.replace(/_/g, ' ')}
                  </span>
                  <span className="wl-date">{new Date(transaction.created_at).toLocaleDateString()}</span>
                </span>
                <span className={`wl-value${income ? ' wl-value--in' : ''}`}>
                  {income ? '+' : '-'}
                  {formatPrice(Math.abs(transaction.amount))}
                </span>
              </li>
            )
          })}
        </ul>
      )}

      {/* Withdrawal Modal */}
      {showWithdrawModal && (
        <div
          className={`withdrawal-modal-overlay ${isMobile ? 'mobile' : ''}`}
          onClick={closeModal}
        >
          <div
            className={`withdrawal-modal-content ${isMobile ? 'bottom-sheet' : ''}`}
            style={{ backgroundColor: Colors.white }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="withdrawal-modal-header" style={{ borderBottomColor: Colors.neutral[200] }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: Colors.neutral[900], margin: 0 }}>
                {t('wallet.withdraw')}
              </h2>
              <button
                onClick={closeModal}
                className="withdrawal-close-button"
              >
                <X size={24} color={Colors.neutral[600]} />
              </button>
            </div>

            <div className="withdrawal-modal-scroll">

            {/* Amount */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: Colors.neutral[900], marginBottom: '8px' }}>
                {t('wallet.amount') || 'Amount (FCFA)'}
              </label>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="0"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: `1px solid ${Colors.neutral[300]}`,
                  fontSize: '16px',
                  color: Colors.neutral[900],
                  backgroundColor: colorScheme === 'dark' ? Colors.neutral[200] : Colors.white
                }}
              />
              <p style={{ fontSize: '12px', color: Colors.neutral[500], marginTop: '4px' }}>
                {t('wallet.availableBalance') || 'Available'}: {formatPrice(withdrawable)}
              </p>
              {hasLockedFunds && (
                <p style={{ fontSize: '12px', color: Colors.warning[700], marginTop: '4px' }}>
                  {t('wallet.totalBalance')}: {formatPrice(balance)} &middot; {t('wallet.someFundsLocked')}
                </p>
              )}
            </div>

            {/* Payment Method */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: Colors.neutral[900], marginBottom: '8px' }}>
                {t('wallet.paymentMethod') || 'Payment Method'}
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setSelectedPaymentMethod('mtn')}
                  style={{
                    flex: 1,
                    padding: '16px',
                    borderRadius: '8px',
                    border: `2px solid ${selectedPaymentMethod === 'mtn' ? Colors.primary[600] : Colors.neutral[300]}`,
                    backgroundColor: selectedPaymentMethod === 'mtn' ? Colors.primary[50] : Colors.white,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <img src="/mtn-logo.svg" alt="MTN" style={{ width: '40px', height: '40px' }} />
                  <span style={{
                    color: selectedPaymentMethod === 'mtn' ? Colors.primary[700] : Colors.neutral[900],
                    fontWeight: selectedPaymentMethod === 'mtn' ? '600' : '500'
                  }}>
                    MTN
                  </span>
                </button>
                <button
                  onClick={() => setSelectedPaymentMethod('orange')}
                  style={{
                    flex: 1,
                    padding: '16px',
                    borderRadius: '8px',
                    border: `2px solid ${selectedPaymentMethod === 'orange' ? Colors.primary[600] : Colors.neutral[300]}`,
                    backgroundColor: selectedPaymentMethod === 'orange' ? Colors.primary[50] : Colors.white,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <img src="/orange-logo.svg" alt="Orange" style={{ width: '40px', height: '40px' }} />
                  <span style={{
                    color: selectedPaymentMethod === 'orange' ? Colors.primary[700] : Colors.neutral[900],
                    fontWeight: selectedPaymentMethod === 'orange' ? '600' : '500'
                  }}>
                    Orange
                  </span>
                </button>
              </div>
            </div>

            {/* Phone Number */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: Colors.neutral[900], marginBottom: '8px' }}>
                {t('wallet.phoneNumber') || 'Phone Number'}
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="6XX XXX XXX"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: `1px solid ${Colors.neutral[300]}`,
                  fontSize: '16px',
                  color: Colors.neutral[900],
                  backgroundColor: colorScheme === 'dark' ? Colors.neutral[200] : Colors.white
                }}
              />
            </div>

            {/* Error Message */}
            {withdrawalMessage && (
              <div style={{
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: Colors.error[50],
                color: Colors.error[700],
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '20px'
              }}>
                <AlertCircle size={16} />
                <span style={{ fontSize: '14px' }}>{withdrawalMessage}</span>
              </div>
            )}

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={closeModal}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  border: `1px solid ${Colors.neutral[300]}`,
                  backgroundColor: Colors.white,
                  color: Colors.neutral[700],
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
                disabled={withdrawalLoading}
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleWithdraw}
                disabled={withdrawalLoading || !withdrawAmount || !phoneNumber || !selectedPaymentMethod}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: withdrawalLoading || !withdrawAmount || !phoneNumber || !selectedPaymentMethod
                    ? Colors.neutral[400]
                    : Colors.primary[600],
                  color: '#FFFFFF',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: withdrawalLoading || !withdrawAmount || !phoneNumber || !selectedPaymentMethod
                    ? 'not-allowed'
                    : 'pointer'
                }}
              >
                {withdrawalLoading ? (t('common.processing') || 'Processing...') : (t('wallet.withdraw') || 'Withdraw')}
              </button>
            </div>
            </div>
          </div>
        </div>
      )}
    </ReservationsPage>
  )
}
