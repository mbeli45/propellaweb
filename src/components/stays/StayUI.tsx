import { isListerRole } from '@/lib/identity'
import { createPortal } from 'react-dom'
import React from 'react'
import { BedDouble, CalendarDays, Minus, Plus, Users } from 'lucide-react'
/** The app's translate function (I18nContext). */
type TFunction = (key: string, options?: any) => string
import { useAuth } from '@/contexts/AuthContext'
import { CardButton, StatusPill, statusTone } from '@/components/reservations/ReservationUI'
import type { CardAction } from '@/components/reservations/ReservationUI'
import {
  StayBooking,
  addDays,
  displayStatus,
  formatStayRange,
  fromISODate,
  hostDepositShare,
  nightsBetween,
  stayRef,
} from '@/lib/stays'
import './Stays.css'

export const formatFcfa = (amount: number | null | undefined) =>
  `${Math.round(Number(amount || 0)).toLocaleString('fr-FR').replace(/ | /g, ' ')} FCFA`

export const nightsLabel = (t: TFunction, count: number) =>
  t(count === 1 ? 'stays.nights_one' : 'stays.nights_other', { count })
export const guestsLabel = (t: TFunction, count: number) =>
  t(count === 1 ? 'stays.guests_one' : 'stays.guests_other', { count })

/** Stays live inside the role's layout: /agent/stays… or /user/stays…; guests use /stays… */
export function useStayBase() {
  const { user } = useAuth()
  if (!user) return ''
  return isListerRole(user.role) ? '/agent' : '/user'
}

/** Map stay statuses onto the shared status tones. */
export const toneStatus = (status: string) =>
  ({ staying: 'confirmed', declined: 'cancelled', expired: 'completed', awaiting_payment: 'pending' } as Record<string, string>)[status] || status

/** One line about the deposit for this booking, or null when no deposit applies. */
export function depositNote(b: StayBooking, perspective: 'guest' | 'host', t: TFunction, locale: string) {
  const deposit = Number(b.deposit_amount || 0)
  if (!deposit || b.payment_status === 'not_required') return null
  const amount = formatFcfa(deposit)
  const rest = formatFcfa(Number(b.total_amount) - deposit)
  const share = formatFcfa(hostDepositShare(b))
  const time = b.payment_due_at
    ? new Date(b.payment_due_at).toLocaleString(locale, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : ''
  type Tone = 'warning' | 'success' | 'neutral'
  const line = (key: string, tone: Tone) => ({ text: t(`stays.deposit.${key}`, { amount, rest, share, time }), tone })
  const paidKey = Number(b.total_amount) > deposit ? 'guestPaid' : 'guestPaidFull'
  switch (b.payment_status) {
    case 'due':
      return b.status !== 'confirmed' ? null : line(perspective === 'guest' ? 'guestDue' : 'hostDue', 'warning')
    case 'paid':
      return perspective === 'guest' ? line(paidKey, 'success') : line('hostPaid', 'success')
    case 'released':
      if (b.status === 'cancelled') return line(perspective === 'guest' ? 'guestKept' : 'hostReleased', 'neutral')
      return perspective === 'guest' ? line(paidKey, 'success') : line('hostReleased', 'success')
    case 'refund_due':
      return perspective === 'guest' ? line('guestRefundDue', 'warning') : line('hostRefund', 'neutral')
    case 'refunded':
      return perspective === 'guest' ? line('guestRefunded', 'neutral') : line('hostRefund', 'neutral')
    default:
      return null
  }
}

export function StayStatusPill({ booking, t }: { booking: StayBooking; t: TFunction }) {
  const status = displayStatus(booking)
  return <StatusPill tone={statusTone(toneStatus(status))} label={t(`stays.status.${status}`)} />
}

export function Stepper({ value, min, max, onChange, label }: { value: number; min: number; max: number; onChange: (v: number) => void; label: string }) {
  return (
    <div className="stay-stepper" role="group" aria-label={label}>
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label={`${label} −`}>
        <Minus size={18} />
      </button>
      <output aria-live="polite">{value}</output>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label={`${label} +`}>
        <Plus size={18} />
      </button>
    </div>
  )
}

/** Horizontal strip of days to pick a date. */
export function DayStrip({ start, days, value, onChange, locale, label }: { start: string; days: number; value: string; onChange: (d: string) => void; locale: string; label: string }) {
  const list = Array.from({ length: days }, (_, i) => addDays(start, i))
  return (
    <div className="stay-days" role="radiogroup" aria-label={label}>
      {list.map((day) => {
        const d = fromISODate(day)
        const active = day === value
        return (
          <button
            key={day}
            type="button"
            role="radio"
            aria-checked={active}
            className={`stay-day${active ? ' is-active' : ''}`}
            onClick={() => onChange(day)}
            aria-label={d.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}
          >
            <span>{d.toLocaleDateString(locale, { weekday: 'short' })}</span>
            <strong>{d.getDate()}</strong>
            <span>{d.toLocaleDateString(locale, { month: 'short' })}</span>
          </button>
        )
      })}
    </div>
  )
}

/** Booking card: status first, then who/where, dates, room and the next step. */
export function StayBookingCard({
  booking,
  t,
  locale,
  perspective,
  actions,
  onOpen,
}: {
  booking: StayBooking
  t: TFunction
  locale: string
  perspective: 'guest' | 'host'
  actions?: CardAction[]
  onOpen?: () => void
}) {
  const nights = nightsBetween(booking.check_in, booking.check_out)
  const image = booking.property?.images?.[0]
  const status = displayStatus(booking)
  const deposit = depositNote(booking, perspective, t, locale)
  return (
    <article className="rsv-card">
      <div className="rsv-body">
        <button type="button" className="rsv-compact-top" onClick={onOpen} disabled={!onOpen}>
          {perspective === 'guest' && (
            <span className="rsv-thumb">{image ? <img src={image} alt="" /> : <BedDouble size={28} aria-hidden="true" />}</span>
          )}
          <span className="rsv-info">
            <span className="rsv-pill-row">
              <StayStatusPill booking={booking} t={t} />
              <span className="rsv-ref">{stayRef(booking.id)}</span>
            </span>
            <span className="rsv-card-title">
              {perspective === 'host' ? booking.guest?.full_name || t('stays.detail.guest') : booking.property?.title || t('stays.title')}
            </span>
            {perspective === 'host' && booking.property?.title && <span className="rsv-inline-meta">{booking.property.title}</span>}
          </span>
        </button>
        <dl className="stay-facts">
          <div>
            <dt><CalendarDays size={14} aria-label={t('stays.detail.dates')} /></dt>
            <dd>{formatStayRange(booking.check_in, booking.check_out, locale)} · {nightsLabel(t, nights)}</dd>
          </div>
          <div>
            <dt><BedDouble size={14} aria-label={t('stays.detail.room')} /></dt>
            <dd>
              {booking.room_type?.name || ''}
              {perspective === 'host' && booking.room?.label ? ` · ${booking.room.label}` : ''}
            </dd>
          </div>
          <div>
            <dt><Users size={14} aria-label={t('stays.guests')} /></dt>
            <dd>{guestsLabel(t, booking.guests)}</dd>
            <strong>{formatFcfa(booking.total_amount)}</strong>
          </div>
        </dl>
        {status === 'pending' && perspective === 'host' && booking.expires_at && (
          <p className="stay-reply-by">
            {t('stays.hub.replyBy', {
              time: new Date(booking.expires_at).toLocaleString(locale, { weekday: 'short', hour: '2-digit', minute: '2-digit' }),
            })}
          </p>
        )}
        {deposit && <p className={`stay-deposit stay-deposit--${deposit.tone}`}>{deposit.text}</p>}
        {perspective === 'host' && booking.guest?.phone && <p className="stay-note">{booking.guest.phone}</p>}
        {booking.guest_note && <p className="stay-note">“{booking.guest_note}”</p>}
        {booking.host_note && perspective === 'guest' && <p className="stay-note">{booking.host_note}</p>}
        {!!actions?.length && (
          <div className="rsv-actions">
            {actions.map((a) => (
              <CardButton key={a.key} label={a.label} icon={a.icon} tone={a.tone} onClick={a.onClick} busy={a.busy} disabled={a.disabled} />
            ))}
          </div>
        )}
      </div>
    </article>
  )
}

/** Accessible modal used by the stay forms. */
export function StayDialog({
  title,
  onClose,
  children,
  footer,
  closeLabel,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
  footer: React.ReactNode
  closeLabel: string
}) {
  const ref = React.useRef<HTMLElement>(null)
  React.useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    ref.current?.querySelector<HTMLElement>('input, select, textarea, button:not(.stay-dialog-close)')?.focus()
    return () => {
      document.body.style.overflow = overflow
      previous?.focus?.()
    }
  }, [])
  // Portalled to <body> so it sits above the bottom navigation and sidebar,
  // whatever stacking context the page renders in.
  return createPortal(
    <div className="rsv-dialog-backdrop rsv-page stay-dialog-root" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section
        ref={ref}
        className="rsv-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
      >
        <div className="rsv-dialog-head">
          <h2>{title}</h2>
          <button type="button" className="rsv-back stay-dialog-close" onClick={onClose} aria-label={closeLabel}>
            ×
          </button>
        </div>
        {children}
        <div className="stay-dialog-foot">{footer}</div>
      </section>
    </div>,
    document.body,
  )
}
