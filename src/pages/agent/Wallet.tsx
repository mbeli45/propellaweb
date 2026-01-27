import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useThemeMode } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/I18nContext'
import { getColors } from '@/constants/Colors'
import { useWallet } from '@/hooks/useWallet'
import { Wallet, ArrowDown, ArrowUp, CreditCard, TrendingUp } from 'lucide-react'
import { formatPrice } from '@/utils/shareUtils'
import './Wallet.css'

export default function AgentWallet() {
  const { user } = useAuth()
  const { colorScheme } = useThemeMode()
  const { t } = useLanguage()
  const Colors = getColors(colorScheme)

  const {
    wallet,
    transactions,
    loading,
    error,
    refreshWallet
  } = useWallet(user?.id || '')

  const balance = wallet?.balance || 0

  // No need for this useEffect - the hook already fetches on mount via useWallet(user?.id)
  // The hook's useEffect (line 14-44) handles fetching wallet and transactions when userId changes
  // useEffect(() => {
  //   if (user?.id) {
  //     refreshWallet()
  //   }
  // }, [user?.id, refreshWallet])

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
          color: Colors.white,
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
    </div>
  )
}
