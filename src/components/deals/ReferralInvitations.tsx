import React from 'react'
import { Inbox, MapPin, RefreshCw } from 'lucide-react'
import { useLanguage } from '@/contexts/I18nContext'
import { type DealForm, type Partner, type ReferralInvitation, declineInvitation, invitationForm, money } from '@/lib/deals'
import { CardButton, EmptyState, Hint, StatusPill, type Tone } from '@/components/reservations/ReservationUI'
import { dealRef } from './DealCard'

const TONES: Record<string, Tone> = {
  // An open invitation is waiting on the agency: amber.
  invited: { bg: 'var(--rsv-warning-tint)', text: 'var(--rsv-warning-ink)', dot: 'var(--rsv-warning)' },
  claimed: { bg: 'var(--rsv-success-tint)', text: 'var(--rsv-success-ink)', dot: 'var(--rsv-success)' },
  closed: { bg: 'var(--rsv-line-soft)', text: 'var(--rsv-ink-2)', dot: 'var(--rsv-faint)' },
}

/** Referral invitations sent to agencies; the first agency to accept gets the client. */
export function ReferralInvitations({
  invitations,
  partners,
  userId,
  admin,
  busy,
  loading,
  onForm,
  onRefresh,
}: {
  invitations: ReferralInvitation[]
  partners: Partner[]
  userId: string
  admin: boolean
  busy: boolean
  loading: boolean
  onForm: (form: DealForm) => void
  onRefresh: () => void
}) {
  const { t } = useLanguage()
  if (!invitations.length) {
    return (
      <EmptyState
        icon={Inbox}
        title={t('deals.emptyInvitationsTitle')}
        body={t('deals.emptyInvitationsBody')}
        action={loading ? undefined : { label: t('deals.checkAgain'), icon: RefreshCw, onClick: onRefresh }}
      />
    )
  }
  const statusLabel = (status: string) =>
    status === 'invited'
      ? t('deals.invitationOpen')
      : status === 'claimed'
        ? t('deals.invitationAccepted')
        : status === 'declined'
          ? t('deals.invitationDeclined')
          : t('deals.invitationClosed')

  return (
    <div className="rsv-grid" style={{ marginTop: 16 }}>
      {invitations.map((invitation) => {
        const own = partners.some((p) => p.id === invitation.partner_id && p.owner_id === userId)
        const open = invitation.status === 'invited'
        return (
          <article className="rsv-card" key={invitation.id}>
            <div className="rsv-body">
              <div className="rsv-pill-row">
                <StatusPill tone={TONES[invitation.status] || TONES.closed} label={statusLabel(invitation.status)} />
                <span className="rsv-ref">{dealRef(invitation.request_id)}</span>
              </div>
              <div className="rsv-location" style={{ color: 'var(--rsv-ink)' }}>
                <MapPin size={15} color="var(--rsv-primary)" aria-hidden="true" />
                <h3 className="rsv-card-title">
                  {invitation.location} · {invitation.purpose === 'buy' ? t('deals.buy') : t('deals.rent')}
                </h3>
              </div>
              {admin && <p className="rsv-muted">{partners.find((p) => p.id === invitation.partner_id)?.name || t('deals.agency')}</p>}
              {!!invitation.requirements && <p className="rsv-detail-text">{invitation.requirements}</p>}
              <div className="rsv-meta">
                <div>
                  <span className="rsv-meta-label">{t('deals.budget')}</span>
                  <span className="rsv-meta-value">{money(invitation.budget)}</span>
                </div>
                <div>
                  <span className="rsv-meta-label">{t('deals.invitationShare')}</span>
                  <span className="rsv-meta-value">{t('deals.invitationShareValue', { percent: invitation.platform_bps / 100 })}</span>
                </div>
              </div>
              {open && <Hint text={t('deals.invitationFirstWins')} />}
              {own && !admin && open && (
                <div className="rsv-actions">
                  <CardButton label={t('deals.invitationAccept')} tone="primary" onClick={() => onForm(invitationForm(invitation))} disabled={busy} />
                  <CardButton label={t('deals.invitationDecline')} tone="neutral" onClick={() => onForm(declineInvitation(invitation))} disabled={busy} />
                </div>
              )}
            </div>
          </article>
        )
      })}
    </div>
  )
}
