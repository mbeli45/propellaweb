import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useThemeMode } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/I18nContext'
import { getColors } from '@/constants/Colors'
import { usePropertyViews } from '@/hooks/usePropertyViews'
import { BarChart3, Eye, TrendingUp, Users, Calendar, Star } from 'lucide-react'
import './Analytics.css'

export default function AgentAnalytics() {
  const { user } = useAuth()
  const { colorScheme } = useThemeMode()
  const { t } = useLanguage()
  const Colors = getColors(colorScheme)
  const { getAgentTotalViews, getAgentPropertyAnalytics } = usePropertyViews()

  const [loading, setLoading] = useState(true)
  const [totalViews, setTotalViews] = useState(0)
  const [propertyAnalytics, setPropertyAnalytics] = useState<any[]>([])

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user?.id) return

      setLoading(true)
      try {
        const [views, analytics] = await Promise.all([
          getAgentTotalViews(user.id),
          getAgentPropertyAnalytics(user.id)
        ])

        setTotalViews(views)
        setPropertyAnalytics(analytics)
      } catch (error) {
        console.error('Error fetching analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [user?.id, getAgentTotalViews, getAgentPropertyAnalytics])

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: Colors.neutral[50]
      }}>
        <div style={{ textAlign: 'center', color: Colors.neutral[600] }}>
          {t('loading.loadingAnalytics') || 'Loading analytics...'}
        </div>
      </div>
    )
  }

  return (
    <div className="analytics-container" style={{ backgroundColor: Colors.neutral[50], minHeight: '100vh' }}>
      <div style={{ padding: '20px 16px' }}>
        <h1 style={{
          fontSize: '24px',
          fontWeight: '700',
          color: Colors.neutral[900],
          marginBottom: '24px'
        }}>
          Analytics
        </h1>

        {/* Overview Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '12px',
          marginBottom: '24px'
        }}>
          <div style={{
            backgroundColor: Colors.white,
            padding: '16px',
            borderRadius: '12px',
            textAlign: 'center',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '20px',
              backgroundColor: Colors.primary[100],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 8px'
            }}>
              <Eye size={20} color={Colors.primary[600]} />
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              color: Colors.neutral[900],
              marginBottom: '4px'
            }}>
              {formatNumber(totalViews)}
            </div>
            <div style={{
              fontSize: '12px',
              color: Colors.neutral[600]
            }}>
              Total Views
            </div>
          </div>

          <div style={{
            backgroundColor: Colors.white,
            padding: '16px',
            borderRadius: '12px',
            textAlign: 'center',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '20px',
              backgroundColor: Colors.success[100],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 8px'
            }}>
              <TrendingUp size={20} color={Colors.success[600]} />
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              color: Colors.neutral[900],
              marginBottom: '4px'
            }}>
              {propertyAnalytics.length}
            </div>
            <div style={{
              fontSize: '12px',
              color: Colors.neutral[600]
            }}>
              Properties
            </div>
          </div>
        </div>

        {/* Property Analytics */}
        {propertyAnalytics.length > 0 && (
          <div style={{
            backgroundColor: Colors.white,
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
          }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: Colors.neutral[900],
              marginBottom: '16px'
            }}>
              Property Performance
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {propertyAnalytics.slice(0, 10).map((property, index) => (
                <div
                  key={property.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    backgroundColor: Colors.neutral[50],
                    borderRadius: '8px'
                  }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '16px',
                    backgroundColor: Colors.primary[100],
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: Colors.primary[700],
                    flexShrink: 0
                  }}>
                    {index + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: Colors.neutral[900],
                      marginBottom: '4px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {property.title || 'Untitled Property'}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: Colors.neutral[600]
                    }}>
                      {property.views || 0} views
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {propertyAnalytics.length === 0 && (
          <div style={{
            padding: '48px 24px',
            textAlign: 'center',
            backgroundColor: Colors.white,
            borderRadius: '12px'
          }}>
            <BarChart3 size={48} color={Colors.neutral[400]} style={{ marginBottom: '16px' }} />
            <h2 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: Colors.neutral[800],
              marginBottom: '8px'
            }}>
              No Analytics Data
            </h2>
            <p style={{ color: Colors.neutral[600] }}>
              Analytics will appear here once your properties receive views
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
