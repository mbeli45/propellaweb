import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useThemeMode } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/I18nContext'
import { useBottomSheet } from '@/contexts/BottomSheetContext'
import { getColors } from '@/constants/Colors'
import { useWallet } from '@/hooks/useWallet'
import { useFapshiWithdrawal } from '@/hooks/useFapshiWithdrawal'
import { Wallet, ArrowDown, ArrowUp, CreditCard, TrendingUp, X, AlertCircle } from 'lucide-react'
import { formatPrice } from '@/utils/shareUtils'
import './Wallet.css'

export default function AgentWallet() {
  const { user } = useAuth()
  const { colorScheme } = useThemeMode()
  const { t } = useLanguage()
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

  const balance = wallet?.balance || 0

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

    if (amount > balance) {
      setWithdrawalMessage(t('wallet.insufficientBalance') || 'Insufficient balance')
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

  return (
    <div className="wallet-container" style={{ backgroundColor: Colors.neutral[50], minHeight: '100vh' }}>
      <div style={{ padding: '20px 16px' }}>
        <h1 style={{ 
          fontSize: '24px', 
          fontWeight: '700', 
          color: Colors.neutral[900],
          marginBottom: '20px'
        }}>
          {t('wallet.title')}
        </h1>

        {/* Balance Card */}
        <div style={{
          backgroundColor: Colors.primary[600],
          borderRadius: '16px',
          padding: '24px',
          color: '#FFFFFF',
          marginBottom: '24px',
          boxShadow: '0 4px 12px rgba(0, 105, 255, 0.2)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px'
          }}>
            <Wallet size={24} />
            <span style={{ fontSize: '14px', opacity: 0.9 }}>
              {t('wallet.totalBalance')}
            </span>
          </div>
          <div style={{
            fontSize: '36px',
            fontWeight: '700',
            marginBottom: '8px'
          }}>
            {formatPrice(balance)} FCFA
          </div>
          <div style={{
            fontSize: '14px',
            opacity: 0.8,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <TrendingUp size={16} />
            {t('wallet.availableForWithdrawal')}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px',
          marginBottom: '24px'
        }}>
          <button
            onClick={() => setShowWithdrawModal(true)}
            style={{
              padding: '16px',
              backgroundColor: Colors.white,
              border: `1px solid ${Colors.neutral[200]}`,
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = Colors.primary[400]
              e.currentTarget.style.backgroundColor = Colors.primary[50]
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = Colors.neutral[200]
              e.currentTarget.style.backgroundColor = Colors.white
            }}
          >
            <ArrowDown size={24} color={Colors.primary[600]} />
            <span style={{ fontSize: '14px', fontWeight: '500', color: Colors.neutral[700] }}>
              {t('wallet.withdraw')}
            </span>
          </button>

          <button
            style={{
              padding: '16px',
              backgroundColor: Colors.white,
              border: `1px solid ${Colors.neutral[200]}`,
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = Colors.primary[400]
              e.currentTarget.style.backgroundColor = Colors.primary[50]
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = Colors.neutral[200]
              e.currentTarget.style.backgroundColor = Colors.white
            }}
          >
            <CreditCard size={24} color={Colors.primary[600]} />
            <span style={{ fontSize: '14px', fontWeight: '500', color: Colors.neutral[700] }}>
              {t('wallet.transactions')}
            </span>
          </button>
        </div>

        {/* Transactions */}
        <div>
          <h2 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: Colors.neutral[900],
            marginBottom: '16px'
          }}>
            {t('wallet.transactionHistory')}
          </h2>

          {loading && (
            <div style={{ textAlign: 'center', padding: '40px', color: Colors.neutral[600] }}>
              {t('common.loading')}...
            </div>
          )}

          {error && (
            <div style={{ textAlign: 'center', padding: '40px', color: Colors.error[600] }}>
              {error}
            </div>
          )}

          {!loading && !error && transactions.length === 0 && (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              backgroundColor: Colors.white,
              borderRadius: '12px'
            }}>
              <CreditCard size={48} color={Colors.neutral[400]} style={{ marginBottom: '16px' }} />
              <p style={{ color: Colors.neutral[600] }}>
                {t('wallet.noTransactions')}
              </p>
            </div>
          )}

          {!loading && !error && transactions.length > 0 && (
            <div className="transactions-list">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="transaction-item"
                  style={{
                    backgroundColor: Colors.white,
                    padding: '16px',
                    borderRadius: '12px',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '20px',
                    backgroundColor: (transaction.type === 'deposit' || transaction.type === 'payment') 
                      ? Colors.success[100] 
                      : Colors.error[100],
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {(transaction.type === 'deposit' || transaction.type === 'payment') ? (
                      <ArrowUp size={20} color={Colors.success[600]} />
                    ) : (
                      <ArrowDown size={20} color={Colors.error[600]} />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: Colors.neutral[900],
                      marginBottom: '4px'
                    }}>
                      {transaction.description || t('wallet.transactions')}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: Colors.neutral[600]
                    }}>
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: (transaction.type === 'deposit' || transaction.type === 'payment')
                      ? Colors.success[600] 
                      : Colors.error[600]
                  }}>
                    {(transaction.type === 'deposit' || transaction.type === 'payment') ? '+' : '-'}
                    {formatPrice(Math.abs(transaction.amount))} FCFA
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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
                {t('wallet.availableBalance') || 'Available'}: {formatPrice(balance)} FCFA
              </p>
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
    </div>
  )
}
