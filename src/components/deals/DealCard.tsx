import React, { useState } from 'react'
import {
  AlertTriangle,
  Ban,
  BadgeCheck,
  CalendarClock,
  CheckCircle,
  ThumbsUp,
  Wallet,
  XCircle,
  ChevronDown,
  ChevronUp,
  CalendarCheck,
  CircleDollarSign,
  Flag,
  HeartHandshake as Handshake,
  Link2,
  Home as HomeIcon,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Receipt,
  User as UserIcon,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useLanguage } from '@/contexts/I18nContext'
import type { Deal, DealEvent, DealForm, DealReport, Partner, PropertyRequest } from '@/lib/deals'
import { configurePartner, dealForms, money, requestActions, resolveReport, reviewPartner, statusLabel } from '@/lib/deals'
import { ActionMenu, CardButton, Hint, StatusPill, Tone } from '@/components/reservations/ReservationUI'
import { AgencyStatusPill, AgencyVerificationDetails } from './AgencyVerification'
import { ClientLinkPanel, useClientDealLink } from './ClientDealLink'
import './DealCard.css'

/*
 * Web counterpart of propella/components/deals/DealCard.tsx: a deal rendered
 * like a property card, with deal-specific actions.
 */

type Workspace = 'admin' | 'agent' | 'customer'

/** The happy path, in order. payment_pending sits between closing and paid. */
const STAGES = ['searching', 'proposed', 'quoted', 'accepted', 'closing', 'paid', 'settled'] as const

export function dealStage(status: string) {
  if (status === 'cancelled') return null
  if (status === 'payment_pending') return { step: 6, total: STAGES.length }
  const index = STAGES.indexOf(status as (typeof STAGES)[number])
  return { step: Math.max(index, 0) + 1, total: STAGES.length }
}

/** The forms that move a deal forward; everything else goes under "More". */
const PRIMARY_ACTIONS = ['pay', 'accept_quote', 'confirm_closing', 'check_payment', 'accept_referral', 'request_closing', 'settle']
const SECONDARY_ORDER = ['propose', 'quote', 'interest', 'follow_up', 'decline_referral', 'report', 'cancel']

export const dealRef = (id: string) => `#${String(id).slice(0, 8).toUpperCase()}`

export function dealTone(status: string): Tone {
  switch (status) {
    case 'quoted':
    case 'closing':
    case 'payment_pending':
      return { bg: 'var(--rsv-warning-tint)', text: 'var(--rsv-warning-ink)', dot: 'var(--rsv-warning)' }
    case 'paid':
    case 'settled':
      return { bg: 'var(--rsv-success-tint)', text: 'var(--rsv-success-ink)', dot: 'var(--rsv-success)' }
    case 'cancelled':
      return { bg: 'var(--rsv-line-soft)', text: 'var(--rsv-ink-2)', dot: 'var(--rsv-faint)' }
    default:
      return { bg: 'var(--rsv-primary-tint)', text: 'var(--rsv-primary-ink)', dot: 'var(--rsv-primary)' }
  }
}

/** One icon per deal action, used on the primary button and in the ⋯ menu. */
const ACTION_ICONS: Record<string, LucideIcon> = {
  pay: CircleDollarSign,
  accept_quote: Handshake,
  accept_referral: Handshake,
  check_payment: Receipt,
  confirm_closing: CheckCircle,
  request_closing: CheckCircle,
  settle: Wallet,
  propose: HomeIcon,
  quote: Receipt,
  interest: ThumbsUp,
  follow_up: CalendarClock,
  decline_referral: XCircle,
  report: Flag,
  cancel: Ban,
}
const actionIcon = (action: string): LucideIcon | undefined => ACTION_ICONS[action]
const DANGER_ACTIONS = ['cancel', 'decline_referral', 'report']

interface DealCardProps {
  deal: Deal
  workspace: Workspace
  userId: string
  admin: boolean
  partners: Partner[]
  reports: DealReport[]
  events: DealEvent[]
  busy: boolean
  highlighted?: boolean
  needsAction: boolean
  onForm: (form: DealForm) => void
  onMessage: (userId: string) => void
  onViewProperty: (propertyId: string) => void
}

export function DealCard({
  deal,
  workspace,
  userId,
  admin,
  partners,
  reports,
  events,
  busy,
  highlighted,
  needsAction,
  onForm,
  onMessage,
  onViewProperty,
}: DealCardProps) {
  const { t, currentLanguage } = useLanguage()
  const [showDetails, setShowDetails] = useState(!!highlighted)
  const locale = currentLanguage === 'fr' ? 'fr-FR' : 'en-US'
  const formatDate = (value: string) => new Date(value).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })

  const isCustomer = workspace === 'customer' && deal.customer_id === userId
  const isAgent = workspace === 'agent' && deal.agent_id === userId
  const tone = dealTone(deal.status)
  const stage = dealStage(deal.status)
  const title = deal.property?.title || deal.title
  const location = deal.property?.location
  const dealReports = reports.filter((report) => report.deal_id === deal.id)
  const openReports = dealReports.filter((report) => report.status === 'open')
  const dealEvents = events.filter((event) => event.deal_id === deal.id)
  const followUpOverdue = admin && new Date(deal.follow_up_at) < new Date()
  const clientLink = useClientDealLink(deal.id)
  // Once the agency has accepted, the client books (and pays for) a site visit
  // on the attached listing; the admin sends the client a private link to it.
  const serviceable = !!deal.agency_accepted_at && deal.status !== 'cancelled'
  const canBookVisit = isCustomer && serviceable && !deal.reservation_id

  const forms = dealForms(deal, userId, admin, partners, workspace)
  const primaryForms = forms.filter((form) => PRIMARY_ACTIONS.includes(form.action))
  const secondaryForms = forms
    .filter((form) => !PRIMARY_ACTIONS.includes(form.action))
    .sort((a, b) => SECONDARY_ORDER.indexOf(a.action) - SECONDARY_ORDER.indexOf(b.action))

  // The customer talks to the agency and vice versa, once the agency has
  // accepted the referral.
  const counterpartId = deal.agency_accepted_at ? (isCustomer ? deal.agent_id : isAgent ? deal.customer_id : null) : null

  const person =
    isAgent || admin
      ? { name: deal.customer?.full_name || t('deals.customer'), subtitle: t('deals.customer'), avatarUrl: deal.customer?.avatar_url ?? null }
      : deal.agent_id && deal.agency_accepted_at
        ? {
            name: deal.agent?.full_name || t('deals.agency'),
            subtitle: deal.agent?.is_verified_agent ? t('deals.verifiedAgency') : t('deals.agency'),
            avatarUrl: deal.agent?.avatar_url ?? null,
            verified: !!deal.agent?.is_verified_agent,
          }
        : { name: t('deals.awaitingAgency'), subtitle: t('deals.agency') }

  const image = deal.property?.images?.[0]
  // The headline figure, like a property card's price: the quoted commission,
  // else the property amount.
  const headline =
    deal.commission_amount != null
      ? { value: money(deal.commission_amount), caption: `${t('deals.commission')} · ${t('deals.quoteVersion', { version: deal.quote_version })}` }
      : deal.transaction_amount != null
        ? { value: money(deal.transaction_amount), caption: t('deals.propertyAmount') }
        : { value: t('deals.notQuoted'), caption: t('deals.commission') }
  // One notice at most: blocking problems first.
  const notice = openReports.length > 0
    ? { warning: true, text: t('deals.openReports', { count: openReports.length }) }
    : !deal.agency_accepted_at && deal.status !== 'cancelled'
      ? { warning: false, text: t('deals.waitingForPartner') }
      : deal.paid_at
        ? { warning: false, text: t('deals.paymentVerified', { date: formatDate(deal.paid_at) }) }
        : canBookVisit && !deal.property_id
          ? { warning: false, text: t('deals.preparingListing') }
          : null

  return (
    <article className={`dc-card${highlighted ? ' dc-card--highlight' : ''}`}>
      <button
        type="button"
        className="dc-media"
        disabled={!deal.property_id}
        onClick={() => deal.property_id && onViewProperty(deal.property_id)}
        aria-label={deal.property_id ? `${t('deals.viewProperty')}: ${title}` : title}
      >
        {image ? <img src={image} alt="" loading="lazy" /> : <HomeIcon size={36} aria-hidden="true" />}
        <span className="dc-gradient" aria-hidden="true" />
        <span className="dc-overlay dc-overlay--top">
          <span className="dc-pill" style={{ color: tone.text }}>
            <span className="rsv-dot" style={{ background: tone.dot }} />
            {statusLabel(deal.status)}
          </span>
          <span className="dc-pill">{dealRef(deal.id)}</span>
        </span>
        {needsAction && (
          <span className="dc-overlay dc-overlay--bottom">
            <span className="dc-pill dc-pill--attention">
              <span className="rsv-dot" />
              {t('reservations.dealActionNeeded')}
            </span>
          </span>
        )}
      </button>

      <div className="dc-info">
        <div className="dc-badges">
          <span>{deal.purpose === 'buy' ? t('deals.buy') : t('deals.rent')}</span>
          <span>{deal.request_id ? t('deals.referralDeal') : t('deals.listedPropertyDeal')}</span>
        </div>

        <p className="dc-price">{headline.value}</p>
        <p className="dc-caption">{headline.caption}</p>
        <h3 className="dc-title">{title}</h3>
        {!!location && (
          <p className="dc-location">
            <MapPin size={14} aria-hidden="true" />
            <span>{location}</span>
          </p>
        )}

        <div className="dc-features">
          <span className="dc-chip" title={person.subtitle}>
            <UserIcon size={14} aria-hidden="true" />
            <span className="dc-chip-text">{person.name}</span>
            {'verified' in person && person.verified && <BadgeCheck size={14} aria-label={t('deals.verifiedAgency')} />}
          </span>
          {stage ? (
            <span
              className="dc-chip"
              role="progressbar"
              aria-valuemin={1}
              aria-valuemax={stage.total}
              aria-valuenow={stage.step}
              aria-label={t('deals.stage', stage)}
            >
              <span className="dc-stage" aria-hidden="true">
                {Array.from({ length: stage.total }, (_, index) => (
                  <span key={index} className={index < stage.step ? 'is-done' : undefined} />
                ))}
              </span>
              {stage.step}/{stage.total}
            </span>
          ) : (
            <span className="dc-chip">{t('deals.closed')}</span>
          )}
          {deal.commission_amount != null && deal.transaction_amount != null && (
            <span className="dc-chip" title={t('deals.propertyAmount')}>
              <HomeIcon size={14} aria-hidden="true" />
              {money(deal.transaction_amount)}
            </span>
          )}
        </div>

        {notice &&
          (notice.warning ? (
            <div className="rsv-warning" role="note">
              <AlertTriangle size={16} aria-hidden="true" />
              <span>{notice.text}</span>
            </div>
          ) : (
            <Hint text={notice.text} />
          ))}

        {/* Actions: the one next step, then Message + ⋯ (everything else in a menu) */}
        {(() => {
          const [nextForm, ...otherPrimary] = primaryForms
          // Booking the site visit comes before any other step for the client.
          const next =
            canBookVisit && deal.property_id
              ? { label: t('deals.bookSiteVisit'), icon: CalendarCheck, onClick: () => onViewProperty(`${deal.property_id}?action=book&deal=${deal.id}`) }
              : nextForm
                ? { label: nextForm.title, icon: actionIcon(nextForm.action), onClick: () => onForm(nextForm) }
                : null
          const menuForms = canBookVisit && deal.property_id ? primaryForms : otherPrimary
          const showLinkButton = admin && serviceable && !clientLink.link
          const menuActions = [...menuForms, ...secondaryForms].map((form) => ({
            key: form.action,
            label: form.title,
            icon: actionIcon(form.action),
            tone: DANGER_ACTIONS.includes(form.action) ? ('danger' as const) : ('default' as const),
            onClick: () => onForm(form),
          }))
          const closed = ['settled', 'cancelled'].includes(deal.status)
          const waitingOn =
            !next && !closed && !notice
              ? deal.status === 'payment_pending'
                ? t('deals.waitingOnPropella')
                : isCustomer
                  ? t('deals.waitingOnAgency')
                  : isAgent
                    ? t('deals.waitingOnCustomer')
                    : null
              : null
          return (
            <>
              {waitingOn && <Hint text={waitingOn} />}
              {next && (
                <div className="dc-actions">
                  <CardButton label={next.label} icon={next.icon} tone="primary" onClick={next.onClick} disabled={busy} busy={busy} block />
                </div>
              )}
              {(counterpartId || showLinkButton || menuActions.length > 0) && (
                <div className="rsv-actions dc-row" style={{ marginTop: next ? 8 : 14 }}>
                  {counterpartId && (
                    <CardButton
                      label={isCustomer ? t('deals.messageAgency') : t('deals.messageCustomer')}
                      icon={MessageCircle}
                      tone="secondary"
                      onClick={() => onMessage(counterpartId)}
                    />
                  )}
                  {showLinkButton && (
                    <CardButton label={t('deals.clientLink')} icon={Link2} tone="secondary" onClick={clientLink.issue} busy={clientLink.busy} />
                  )}
                  {menuActions.length > 0 && (
                    <ActionMenu label={t('deals.moreActions')} actions={menuActions} disabled={busy} wide={!counterpartId && !showLinkButton} />
                  )}
                </div>
              )}
              {admin && serviceable && <ClientLinkPanel state={clientLink} />}
            </>
          )
        })()}

        <div className="dc-links">
          <button type="button" className="rsv-toggle" aria-expanded={showDetails} onClick={() => setShowDetails((value) => !value)}>
            {showDetails ? t('deals.hideDetails') : t('deals.showDetails')}
            {showDetails ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
          </button>
        </div>

        {showDetails && (
          <div className="rsv-details">
            <p className="rsv-muted">{person.subtitle}: {person.name}</p>
            {deal.commission_amount != null && (
              <Detail label={t('deals.commission')} text={money(deal.commission_amount)} />
            )}
            {deal.transaction_amount != null && <Detail label={t('deals.propertyAmount')} text={money(deal.transaction_amount)} />}
            {!!deal.requirements && <Detail label={t('deals.requirements')} text={deal.requirements} />}
            {!!deal.proposal && <Detail label={t('deals.proposal')} text={deal.proposal} />}
            {!!deal.sourcing_agency && <Detail label={t('deals.supplyingAgency')} text={deal.sourcing_agency} />}
            {!!deal.fee_basis && <Detail label={t('deals.feeBasis')} text={deal.fee_basis} />}
            {!!deal.closing_note && <Detail label={t('deals.closingDetails')} text={deal.closing_note} />}
            {(isAgent || admin) && deal.platform_bps != null && (
              <p className="rsv-muted">{t('deals.platformShare', { percent: deal.platform_bps / 100 })}</p>
            )}
            {admin && (
              <p className="rsv-muted" style={followUpOverdue ? { color: 'var(--rsv-warning-ink)', fontWeight: 600 } : undefined}>
                {t('deals.followUp', { date: formatDate(deal.follow_up_at) })}
              </p>
            )}
            {!!deal.paid_at && (
              <p className="rsv-muted">
                Receipt: <code>{deal.id}</code>
              </p>
            )}

            {dealReports.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="rsv-detail-label">{t('deals.reports')}</div>
                {dealReports.map((report) => (
                  <div key={report.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <p className="rsv-detail-text">
                      ({report.status}) {report.description}
                    </p>
                    {!!report.resolution && <p className="rsv-muted">{report.resolution}</p>}
                    {admin && report.status === 'open' && (
                      <CardButton label={t('deals.resolveReport')} tone="neutral" onClick={() => onForm(resolveReport(report))} disabled={busy} block />
                    )}
                  </div>
                ))}
              </div>
            )}

            {dealEvents.length > 0 && (
              <div>
                <div className="rsv-detail-label">{t('deals.activity')}</div>
                <ol className="rsv-events">
                  {dealEvents.map((event) => (
                    <li key={event.id}>
                      <span>
                        {formatDate(event.created_at)} · {event.action.replace(/_/g, ' ')}
                        {event.action === 'quote' && event.detail?.commission_amount != null && (
                          <> · {money(Number(event.detail.commission_amount))}</>
                        )}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  )
}

function Detail({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <div className="rsv-detail-label">{label}</div>
      <p className="rsv-detail-text">{text}</p>
    </div>
  )
}

export function RequestCard({
  request,
  partners,
  assigned,
  admin,
  busy,
  onForm,
}: {
  request: PropertyRequest
  partners: Partner[]
  assigned: boolean
  admin: boolean
  busy: boolean
  onForm: (form: DealForm) => void
}) {
  const { t } = useLanguage()
  const tone: Tone = assigned
    ? { bg: 'var(--rsv-success-tint)', text: 'var(--rsv-success-ink)', dot: 'var(--rsv-success)' }
    : { bg: 'var(--rsv-warning-tint)', text: 'var(--rsv-warning-ink)', dot: 'var(--rsv-warning)' }
  return (
    <article className="rsv-card">
      <div className="rsv-body">
        <div className="rsv-pill-row">
          <StatusPill tone={tone} label={assigned ? t('deals.assigned') : t('deals.awaitingAssignment')} />
          <span className="rsv-ref">{dealRef(request.id)}</span>
        </div>
        <div className="rsv-location" style={{ color: 'var(--rsv-ink)' }}>
          <MapPin size={15} color="var(--rsv-primary)" aria-hidden="true" />
          <h3 className="rsv-card-title">
            {request.location} · {request.purpose === 'buy' ? t('deals.buy') : t('deals.rent')}
          </h3>
        </div>
        {!!request.requirements && <p className="rsv-detail-text">{request.requirements}</p>}
        <div className="rsv-meta" style={{ gridTemplateColumns: '1fr' }}>
          <div>
            <span className="rsv-meta-label">{t('deals.budget')}</span>
            <span className="rsv-meta-value">{money(request.budget)}</span>
          </div>
        </div>
        {admin && !!(request.source || request.contact_note) && (
          <p className="rsv-muted">
            {request.source} · {request.contact_note}
          </p>
        )}
        {admin &&
          requestActions(request, partners, assigned).map((form) => (
            <CardButton key={form.action} label={form.title} tone="neutral" onClick={() => onForm(form)} disabled={busy} block />
          ))}
      </div>
    </article>
  )
}

export function PartnerCard({
  partner,
  admin,
  busy,
  onForm,
}: {
  partner: Partner
  admin: boolean
  busy: boolean
  onForm: (form: DealForm) => void
}) {
  const { t } = useLanguage()
  return (
    <article className="rsv-card">
      <div className="rsv-body">
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span className="rsv-thumb" style={{ width: 52, height: 52, background: 'var(--rsv-primary-tint)', color: 'var(--rsv-primary)' }}>
            <Handshake size={24} aria-hidden="true" />
          </span>
          <div className="rsv-info">
            <h3 className="rsv-card-title" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {partner.name}
              {partner.status === 'active' && partner.verification_status === 'approved' && <BadgeCheck size={14} color="var(--rsv-primary)" aria-label="active" />}
            </h3>
            <p className="rsv-muted">
              {partner.regions} · {partner.status}
            </p>
          </div>
        </div>
        <p className="rsv-detail-text">{t('deals.partnerShare', { percent: partner.platform_bps / 100 })}</p>
        <AgencyStatusPill partner={partner} />
        {partner.verification_note && (
          <div>
            <div className="rsv-detail-label">{t('agencyVerify.reviewerNote')}</div>
            <p className="rsv-detail-text">{partner.verification_note}</p>
          </div>
        )}
        <AgencyVerificationDetails partner={partner} />
        {admin && partner.verification_submitted_at && (
          <div className="av-review-actions">
            <CardButton label={t('agencyVerify.approve')} tone="primary" onClick={() => onForm(reviewPartner(partner, 'approved'))} disabled={busy} />
            <CardButton label={t('agencyVerify.requestChanges')} tone="neutral" onClick={() => onForm(reviewPartner(partner, 'changes_requested'))} disabled={busy} />
          </div>
        )}
        {admin && <CardButton label={t('deals.managePartner')} tone="neutral" onClick={() => onForm(configurePartner(partner))} disabled={busy} block />}
      </div>
    </article>
  )
}
