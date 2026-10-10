import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useLanguage } from '@/contexts/I18nContext'
import { useIdentityGate } from '@/hooks/useIdentityGate'
import { PageHeader, ReservationsPage } from '@/components/reservations/ReservationUI'
import { IdentityStep } from './IdentityStep'

/** ID submission returns to the dashboard; a later visit can open the wrapped page. */
export function IdentityGate({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const { state, setState, loading, stage, refresh } = useIdentityGate()

  if (loading) {
    return (
      <ReservationsPage label={t('identity.title')} narrow>
        <p className="rsv-muted" role="status">
          <Loader2 size={18} className="rsv-spin" aria-hidden="true" />
        </p>
      </ReservationsPage>
    )
  }
  if (stage === 'clear' || stage === 'review') return <>{children}</>

  return (
    <ReservationsPage label={t('identity.title')} narrow>
      <PageHeader title={t('identity.title')} subtitle={t('identity.subtitle')} onBack={() => navigate(-1)} backLabel={t('common.back')} />
      <IdentityStep state={state} onChange={setState} onDone={() => navigate('/agent', { replace: true })} onRetry={() => void refresh()} lead={t('identity.gateLead')} />
    </ReservationsPage>
  )
}
