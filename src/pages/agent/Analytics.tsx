import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart3, TrendingUp } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/I18nContext'
import { usePropertyViews } from '@/hooks/usePropertyViews'
import { DashboardSkeleton } from '@/components/skeletons'
import {
  EmptyState,
  PageHeader,
  ReservationsPage,
  SettingsGroup,
  SettingsRow,
  StatStrip,
} from '@/components/reservations/ReservationUI'

const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return String(num || 0)
}

export default function AgentAnalytics() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const { getAgentTotalViews, getAgentPropertyAnalytics } = usePropertyViews()

  const [loading, setLoading] = useState(true)
  const [totalViews, setTotalViews] = useState(0)
  const [propertyAnalytics, setPropertyAnalytics] = useState<any[]>([])

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user?.id) return
      setLoading(true)
      try {
        const [views, analytics] = await Promise.all([getAgentTotalViews(user.id), getAgentPropertyAnalytics(user.id)])
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

  return (
    <ReservationsPage narrow label={t('agentDashboard.analytics')}>
      <PageHeader
        title={t('agentDashboard.analytics')}
        subtitle={t('agentDashboard.analyticsSubtitle')}
        onBack={() => ((window.history.state?.idx ?? 0) > 0 ? navigate(-1) : navigate('/agent'))}
        backLabel={t('common.back')}
      />

      {loading ? (
        <DashboardSkeleton statCount={3} listCount={4} />
      ) : (
        <>
          <StatStrip
            items={[
              { label: t('agent.views'), value: formatNumber(totalViews) },
              { label: t('agentDashboard.listings'), value: propertyAnalytics.length },
              {
                label: t('agentDashboard.avgViews'),
                value: propertyAnalytics.length ? formatNumber(Math.round(totalViews / propertyAnalytics.length)) : '0',
              },
            ]}
          />

          {propertyAnalytics.length === 0 ? (
            <EmptyState icon={BarChart3} title={t('agentDashboard.noViewsYet')} body={t('agentDashboard.noViewsBody')} />
          ) : (
            <SettingsGroup title={t('agentDashboard.topListings')}>
              {propertyAnalytics.slice(0, 10).map((property) => (
                <SettingsRow
                  key={property.property_id}
                  icon={TrendingUp}
                  label={property.title}
                  detail={t('agentDashboard.viewsLine', {
                    week: formatNumber(property.views_this_week),
                    unique: formatNumber(property.unique_viewers),
                  })}
                  value={formatNumber(property.view_count)}
                  valueStrong
                  onClick={() => navigate(`/property/${property.property_id}`)}
                />
              ))}
            </SettingsGroup>
          )}
        </>
      )}
    </ReservationsPage>
  )
}
