import React from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useLanguage } from '@/contexts/I18nContext'
import { useIdentityGate } from '@/hooks/useIdentityGate'
import { IdentityStep } from '@/components/identity/IdentityStep'
import { PageHeader, ReservationsPage } from '@/components/reservations/ReservationUI'

/**
 * ID step for new agents and landlords. Opened right after sign-up (?onboarding=1)
 * and from the dashboard banner.
 */
export default function ProfileIdentity() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const onboarding = params.has('onboarding')
  const { state, setState, loading, refresh } = useIdentityGate()

  return (
    <ReservationsPage label={t('identity.title')} narrow>
      <PageHeader
        title={t('identity.title')}
        subtitle={t('identity.subtitle')}
        onBack={onboarding ? undefined : () => navigate(-1)}
        backLabel={t('common.back')}
      />
      {loading ? (
        <p className="rsv-muted" role="status">
          <Loader2 size={18} className="rsv-spin" aria-hidden="true" />
        </p>
      ) : (
        <IdentityStep
          state={state}
          onChange={setState}
          onRetry={() => void refresh()}
          onDone={() => navigate('/agent/property/add', { replace: true })}
          later={onboarding ? { label: t('identity.later'), onClick: () => navigate('/agent', { replace: true }) } : undefined}
        />
      )}
    </ReservationsPage>
  )
}
