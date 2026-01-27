import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useThemeMode } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/I18nContext'
import { getColors } from '@/constants/Colors'
import { useCommissionPayment } from '@/hooks/useCommissionPayment'
import { Shield, Clock, CheckCircle, AlertTriangle, DollarSign, Filter } from 'lucide-react'
import { formatPrice } from '@/utils/shareUtils'
import './Commissions.css'

export default function UserCommissions() {
  const { user } = useAuth()
  const { colorScheme } = useThemeMode()
  const { t } = useLanguage()
  const Colors = getColors(colorScheme)

  const { getCommissionPayments, loading } = useCommissionPayment()
  const [commissionPayments, setCommissionPayments] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'all' | 'paid' | 'pending' | 'released'>('all')

  useEffect(() => {
    loadCommissions()
  }, [])

  const loadCommissions = async () => {
    try {
      const payments = await getCommissionPayments()
      setCommissionPayments(payments || [])
    } catch (error) {
      console.error('Failed to load commissions:', error)
    }
  }

  const filteredPayments = commissionPayments.filter(payment => {
    if (activeTab === 'all') return true
    return payment.status === activeTab
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return Colors.success[600]
      case 'pending':
        return Colors.warning[600]
      case 'released':
        return Colors.primary[600]
      case 'disputed':
        return Colors.error[600]
      default:
        return Colors.neutral[600]
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle size={16} color={Colors.success[600]} />
      case 'pending':
        return <Clock size={16} color={Colors.warning[600]} />
      case 'released':
        return <DollarSign size={16} color={Colors.primary[600]} />
      case 'disputed':
        return <AlertTriangle size={16} color={Colors.error[600]} />
      default:
        return <Clock size={16} color={Colors.neutral[600]} />
    }
  }

  const totalAmount = filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0)
  const totalPlatformFee = filteredPayments.reduce((sum, p) => sum + (p.platform_fee || 0), 0)
  const totalAgentAmount = filteredPayments.reduce((sum, p) => sum + (p.agent_amount || 0), 0)

  return (
    <div className="commissions-container" style={{ backgroundColor: Colors.neutral[50], minHeight: '100vh' }}>
      <div style={{ padding: '20px 16px' }}>
        <h1 style={{
          fontSize: '24px',
          fontWeight: '700',
          color: Colors.neutral[900],
          marginBottom: '20px'
        }}>
          {t('commission.commissionPayments')}
        </h1>

        {/* Summary Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          marginBottom: '24px'
        }}>
          <div style={{
            backgroundColor: Colors.white,
            padding: '16px',
            borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{
              fontSize: '12px',
              color: Colors.neutral[600],
              marginBottom: '8px'
            }}>
              {t('commissions.paid')}
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              color: Colors.neutral[900]
            }}>
              {commissionPayments.filter(p => p.status === 'paid').length}
            </div>
          </div>

          <div style={{
            backgroundColor: Colors.white,
            padding: '16px',
            borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{
              fontSize: '12px',
              color: Colors.neutral[600],
              marginBottom: '8px'
            }}>
              {t('commissions.pending')}
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              color: Colors.neutral[900]
            }}>
              {commissionPayments.filter(p => p.status === 'pending').length}
            </div>
          </div>

          <div style={{
            backgroundColor: Colors.white,
            padding: '16px',
            borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{
              fontSize: '12px',
              color: Colors.neutral[600],
              marginBottom: '8px'
            }}>
              {t('commissions.totalAmount')}
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              color: Colors.neutral[900]
            }}>
              {formatPrice(totalAmount)} FCFA
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '20px',
          backgroundColor: Colors.white,
          padding: '4px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
        }}>
          {(['all', 'paid', 'pending', 'released'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: activeTab === tab ? Colors.primary[600] : 'transparent',
                color: activeTab === tab ? Colors.white : Colors.neutral[700],
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                textTransform: 'capitalize'
              }}
            >
              {t(`commissions.${tab}`)}
            </button>
          ))}
        </div>

        {/* Payments List */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px', color: Colors.neutral[600] }}>
            {t('common.loading')}...
          </div>
        )}

        {!loading && filteredPayments.length === 0 && (
          <div style={{
            padding: '48px 24px',
            textAlign: 'center',
            backgroundColor: Colors.white,
            borderRadius: '12px'
          }}>
            <Shield size={48} color={Colors.neutral[400]} style={{ marginBottom: '16px' }} />
            <h2 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: Colors.neutral[800],
              marginBottom: '8px'
            }}>
              {t('commissions.noCommissionPayments')}
            </h2>
            <p style={{ color: Colors.neutral[600] }}>
              {t('commission.commissionPayments')} will appear here
            </p>
          </div>
        )}

        {!loading && filteredPayments.length > 0 && (
          <div className="commissions-list">
            {filteredPayments.map((payment) => (
              <div
                key={payment.id}
                style={{
                  backgroundColor: Colors.white,
                  padding: '20px',
                  borderRadius: '12px',
                  marginBottom: '12px',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '16px'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: Colors.neutral[900],
                      marginBottom: '8px'
                    }}>
                      {payment.property?.title || 'Property'}
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: Colors.neutral[600],
                      marginBottom: '4px'
                    }}>
                      {new Date(payment.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    backgroundColor: `${getStatusColor(payment.status)}20`,
                    color: getStatusColor(payment.status),
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {getStatusIcon(payment.status)}
                    <span style={{ textTransform: 'capitalize' }}>
                      {t(`commissions.${payment.status}`)}
                    </span>
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '12px',
                  padding: '12px',
                  backgroundColor: Colors.neutral[50],
                  borderRadius: '8px'
                }}>
                  <div>
                    <div style={{
                      fontSize: '12px',
                      color: Colors.neutral[600],
                      marginBottom: '4px'
                    }}>
                      {t('commissions.totalAmount')}
                    </div>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: Colors.neutral[900]
                    }}>
                      {formatPrice(payment.amount || 0)} FCFA
                    </div>
                  </div>
                  <div>
                    <div style={{
                      fontSize: '12px',
                      color: Colors.neutral[600],
                      marginBottom: '4px'
                    }}>
                      {t('commissions.platformFee')}
                    </div>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: Colors.neutral[700]
                    }}>
                      {formatPrice(payment.platform_fee || 0)} FCFA
                    </div>
                  </div>
                  <div>
                    <div style={{
                      fontSize: '12px',
                      color: Colors.neutral[600],
                      marginBottom: '4px'
                    }}>
                      {t('commissions.agentAmount')}
                    </div>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: Colors.primary[600]
                    }}>
                      {formatPrice(payment.agent_amount || 0)} FCFA
                    </div>
                  </div>
                </div>

                {payment.escrow_status === 'holding' && (
                  <div style={{
                    marginTop: '12px',
                    padding: '12px',
                    backgroundColor: Colors.primary[50],
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: Colors.primary[700]
                  }}>
                    {t('commissions.escrowProtected')}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
