import React, { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { HeartHandshake, Link2Off, Loader2, LogIn, UserPlus } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/I18nContext'
import { dealDb } from '@/lib/deals'
import { clearClientInvitation, pendingClientInvitation, rememberClientInvitation } from '@/lib/clientInvitation'
import { CardButton, EmptyState, ReservationsPage } from '@/components/reservations/ReservationUI'
import './ClientDealInvitation.css'

/**
 * Landing page for a client deal invitation (/deal-invite#invite=<token>).
 * The token is kept until the client signs in or signs up, then accepted,
 * which links the client to the deal and opens it.
 */
export default function ClientDealInvitation() {
  const { user, loading } = useAuth()
  const { t } = useLanguage()
  const location = useLocation()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)
  const running = useRef(false)

  // Move the token out of the URL into storage so it survives the auth round trip.
  useEffect(() => {
    try {
      const incoming = new URLSearchParams(location.hash.slice(1)).get('invite')
      if (incoming) {
        rememberClientInvitation(incoming)
        navigate('/deal-invite', { replace: true })
      }
      setReady(true)
    } catch (e) {
      setError((e as Error).message)
    }
  }, [location.hash, navigate])

  useEffect(() => {
    if (!ready || loading || !user || running.current || error) return
    const token = pendingClientInvitation()
    if (!token) {
      setError(t('clientInvite.missing'))
      return
    }
    running.current = true
    void dealDb.rpc('deal_client_link', { p_action: 'accept', p_token: token }).then(({ data, error: rpcError }) => {
      if (rpcError) {
        setError(rpcError.message)
        running.current = false
        return
      }
      clearClientInvitation()
      navigate(`/user/deals/${data.deal_id}`, { replace: true })
    })
  }, [ready, loading, user, error, navigate, t])

  return (
    <ReservationsPage label={t('clientInvite.title')} narrow>
      <div className="cdi-wrap">
        {error ? (
          <>
            <EmptyState icon={Link2Off} title={t('clientInvite.errorTitle')} body={error} />
            <div className="rsv-actions">
              <CardButton
                label={t('clientInvite.continue')}
                tone="neutral"
                onClick={() => {
                  clearClientInvitation()
                  navigate(user ? '/user/deals' : '/')
                }}
              />
            </div>
          </>
        ) : loading || user ? (
          <p className="cdi-status" role="status">
            <Loader2 size={18} className="rsv-spin" aria-hidden="true" />
            {t('clientInvite.opening')}
          </p>
        ) : (
          <>
            <EmptyState icon={HeartHandshake} title={t('clientInvite.title')} body={t('clientInvite.body')} />
            <div className="rsv-actions">
              <CardButton label={t('clientInvite.login')} icon={LogIn} tone="primary" onClick={() => navigate('/auth/login')} />
              <CardButton label={t('clientInvite.signup')} icon={UserPlus} tone="neutral" onClick={() => navigate('/auth/signup')} />
            </div>
          </>
        )}
      </div>
    </ReservationsPage>
  )
}
