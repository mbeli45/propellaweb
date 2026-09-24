import React from 'react'
import {
  ArrowLeft,
  BadgeCheck,
  CalendarClock,
  ChevronRight,
  Home as HomeIcon,
  Info,
  Loader2,
  MapPin,
  Search,
  ShieldCheck,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import VideoThumbnail from '@/components/VideoThumbnail'
import { isVideoUrl } from '@/utils/videoUtils'
import './ReservationUI.css'

/*
 * Web counterpart of propella/components/reservations/ReservationUI.tsx.
 * Same components and props, rendered as semantic HTML + ReservationUI.css.
 */

// ---------------------------------------------------------------------------
// Helpers (identical to mobile)
// ---------------------------------------------------------------------------

export type ReservationSection = 'today' | 'upcoming' | 'past'

/** Short, human-friendly booking reference derived from the reservation id. */
export const reservationRef = (id: string) => `#${String(id).slice(0, 8).toUpperCase()}`

/** reservation_date is a plain YYYY-MM-DD; parse it as a local calendar day. */
export function visitDay(reservation: any): Date | null {
  const raw = reservation?.reservation_date
  if (!raw) return null
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(raw))
  if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  const parsed = new Date(raw)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function isVisitToday(reservation: any) {
  const day = visitDay(reservation)
  if (!day) return false
  const now = new Date()
  return day.getFullYear() === now.getFullYear() && day.getMonth() === now.getMonth() && day.getDate() === now.getDate()
}

/**
 * today    - confirmed visits happening today or already due for completion
 * upcoming - confirmed future visits and requests awaiting the agent
 * past     - completed, cancelled or otherwise closed
 */
export function sectionOf(reservation: any): ReservationSection {
  const status = reservation?.status
  if (status === 'pending') return 'upcoming'
  if (status !== 'confirmed') return 'past'
  const day = visitDay(reservation)
  if (!day) return 'upcoming'
  const endOfToday = new Date()
  endOfToday.setHours(23, 59, 59, 999)
  return day <= endOfToday ? 'today' : 'upcoming'
}

export function groupReservations<T>(reservations: T[]) {
  const groups: Record<ReservationSection, T[]> = { today: [], upcoming: [], past: [] }
  for (const reservation of reservations) groups[sectionOf(reservation)].push(reservation)
  const byDay = (a: any, b: any) => (visitDay(a)?.getTime() ?? 0) - (visitDay(b)?.getTime() ?? 0)
  groups.today.sort(byDay)
  groups.upcoming.sort(byDay)
  groups.past.sort((a, b) => byDay(b, a))
  return groups
}

export function formatVisitSlot(reservation: any, locale: string) {
  const day = visitDay(reservation)
  if (!day) return '—'
  const date = day.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' })
  if (!reservation.reservation_time) return date
  const time = new Date(`2000-01-01T${reservation.reservation_time}`).toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  })
  return `${date} · ${time}`
}

export const formatFcfa = (amount: number | null | undefined) =>
  amount == null ? '—' : `${Number(amount).toLocaleString()} FCFA`

export type Tone = { bg: string; text: string; dot: string }

export function statusTone(status: string): Tone {
  switch (status) {
    case 'confirmed':
      return { bg: 'var(--rsv-success-tint)', text: 'var(--rsv-success-ink)', dot: 'var(--rsv-success)' }
    case 'pending':
      return { bg: 'var(--rsv-warning-tint)', text: 'var(--rsv-warning-ink)', dot: 'var(--rsv-warning)' }
    case 'cancelled':
    case 'failed':
      return { bg: 'var(--rsv-error-tint)', text: 'var(--rsv-error-ink)', dot: 'var(--rsv-error)' }
    default:
      return { bg: 'var(--rsv-line-soft)', text: 'var(--rsv-ink-2)', dot: 'var(--rsv-faint)' }
  }
}

// ---------------------------------------------------------------------------
// Page chrome
// ---------------------------------------------------------------------------

export function ReservationsPage({ children, label }: { children: React.ReactNode; label?: string }) {
  return (
    <main className="rsv-page" aria-label={label}>
      {children}
    </main>
  )
}

export function ReservationsHeader({
  title,
  count,
  subtitle,
  action,
  onBack,
  backLabel,
  children,
}: {
  title: string
  count: number
  subtitle: string
  action?: { label: string; icon: LucideIcon; onClick: () => void; badge?: number }
  onBack?: () => void
  backLabel?: string
  /** Rendered above the title, e.g. a Bookings | Deals section switch. */
  children?: React.ReactNode
}) {
  const ActionIcon = action?.icon
  return (
    <header className="rsv-header">
      {children}
      <div className="rsv-header-row">
        <div className="rsv-title-row">
          {onBack && (
            <button type="button" className="rsv-back" onClick={onBack} aria-label={backLabel}>
              <ArrowLeft size={20} />
            </button>
          )}
          <h1 className="rsv-title">{title}</h1>
          <span className="rsv-count" aria-label={String(count)}>
            {count}
          </span>
        </div>
        {action && ActionIcon && (
          <button type="button" className="rsv-btn rsv-btn--primary" onClick={action.onClick}>
            <ActionIcon size={16} />
            {action.label}
            {!!action.badge && action.badge > 0 && <span className="rsv-btn-badge">{action.badge}</span>}
          </button>
        )}
      </div>
      <p className="rsv-subtitle">{subtitle}</p>
    </header>
  )
}

export interface FilterOption {
  key: string
  label: string
  count: number
}

export function ReservationToolbar({
  search,
  onSearch,
  placeholder,
  options,
  value,
  onChange,
  label,
}: {
  search: string
  onSearch: (value: string) => void
  placeholder: string
  options: FilterOption[]
  value: string
  onChange: (key: string) => void
  label: string
}) {
  return (
    <div className="rsv-toolbar">
      <label className="rsv-search">
        <Search size={18} aria-hidden="true" />
        <input type="search" value={search} onChange={(e) => onSearch(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
      </label>
      <div className="rsv-chips" role="group" aria-label={label}>
        {options.map((option) => (
          <button
            key={option.key}
            type="button"
            className="rsv-chip"
            aria-pressed={option.key === value}
            onClick={() => onChange(option.key)}
          >
            {option.label}
            <span className="rsv-chip-count">{option.count}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export function ReservationSectionView({
  icon: Icon,
  title,
  meta,
  live,
  hero,
  children,
}: {
  icon?: LucideIcon
  title: string
  meta?: string
  live?: string
  /** Wider columns for hero cards. */
  hero?: boolean
  children: React.ReactNode
}) {
  return (
    <section className="rsv-section">
      <div className="rsv-section-head">
        <h2 className="rsv-section-title">
          {Icon && <Icon size={18} aria-hidden="true" />}
          {title}
        </h2>
        {live ? (
          <span className="rsv-live">
            <span className="rsv-dot" />
            {live}
          </span>
        ) : meta ? (
          <span className="rsv-section-meta">{meta}</span>
        ) : null}
      </div>
      <div className={`rsv-grid${hero ? ' rsv-grid--hero' : ''}`}>{children}</div>
    </section>
  )
}

export function Banner({
  icon: Icon,
  title,
  body,
  attention,
  primary,
  secondary,
}: {
  icon: LucideIcon
  title: string
  body: string
  attention?: string
  primary: { label: string; onClick: () => void }
  secondary?: { label: string; onClick: () => void }
}) {
  return (
    <div className="rsv-banner">
      <div className="rsv-banner-head">
        <span className="rsv-banner-icon" aria-hidden="true">
          <Icon size={20} />
        </span>
        <div>
          <p className="rsv-banner-title">{title}</p>
          <p className="rsv-banner-body">{body}</p>
          {attention && (
            <span className="rsv-attention">
              <span className="rsv-dot" />
              {attention}
            </span>
          )}
        </div>
      </div>
      <div className="rsv-banner-actions">
        <CardButton label={primary.label} tone="primary" onClick={primary.onClick} />
        {secondary && <CardButton label={secondary.label} tone="neutral" onClick={secondary.onClick} />}
      </div>
    </div>
  )
}

export function PaymentMonitorBanner({
  title,
  status,
  progress,
  message,
  timeLeft,
}: {
  title: string
  status: string
  progress: number
  message: string
  timeLeft: string
}) {
  const clamped = Math.max(0, Math.min(100, progress))
  return (
    <div className="rsv-banner" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(clamped)} aria-label={title}>
      <div className="rsv-section-head">
        <p className="rsv-banner-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Loader2 size={16} className="rsv-spin" aria-hidden="true" />
          {title}
        </p>
        {!!status && <strong style={{ fontSize: 12, color: 'var(--rsv-primary-ink)' }}>{status}</strong>}
      </div>
      <div className="rsv-progress">
        <span style={{ width: `${clamped}%` }} />
      </div>
      <div className="rsv-progress-foot">
        <span>{message}</span>
        <strong>{timeLeft}</strong>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Card building blocks
// ---------------------------------------------------------------------------

export type ButtonTone = 'primary' | 'secondary' | 'neutral' | 'ghost' | 'danger'

export interface CardAction {
  key: string
  label: string
  icon?: LucideIcon
  tone: ButtonTone
  onClick: () => void
  disabled?: boolean
  busy?: boolean
}

export function CardButton({ label, icon: Icon, tone, onClick, disabled, busy, block }: Omit<CardAction, 'key'> & { block?: boolean }) {
  return (
    <button
      type="button"
      className={`rsv-btn rsv-btn--${tone}${block ? ' rsv-btn--block' : ''}`}
      onClick={onClick}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
    >
      {busy ? <Loader2 size={16} className="rsv-spin" aria-hidden="true" /> : Icon && <Icon size={16} aria-hidden="true" />}
      {label}
    </button>
  )
}

export function StatusPill({ tone, label }: { tone: Tone; label: string }) {
  return (
    <span className="rsv-status" style={{ background: tone.bg, color: tone.text }}>
      <span className="rsv-dot" style={{ background: tone.dot }} />
      {label}
    </span>
  )
}

export function Hint({ text }: { text: string }) {
  return (
    <div className="rsv-hint">
      <Info size={15} aria-hidden="true" />
      <span>{text}</span>
    </div>
  )
}

export function DealStrip({
  icon: Icon,
  label,
  status,
  actionLabel,
  attention,
  onClick,
}: {
  icon: LucideIcon
  label: string
  status: string
  actionLabel: string
  attention?: boolean
  onClick: () => void
}) {
  return (
    <button type="button" className={`rsv-deal-strip${attention ? ' rsv-deal-strip--attention' : ''}`} onClick={onClick}>
      <Icon size={18} aria-hidden="true" />
      <span style={{ flex: 1, minWidth: 0 }}>
        <span className="rsv-deal-label">{label}</span>
        <span className="rsv-deal-status">{status}</span>
      </span>
      <span className="rsv-deal-action">{actionLabel}</span>
      <ChevronRight size={16} aria-hidden="true" color="var(--rsv-primary)" />
    </button>
  )
}

export interface PersonInfo {
  name: string
  subtitle?: string
  avatarUrl?: string | null
  verified?: boolean
}

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

export function PersonStrip({ person }: { person: PersonInfo }) {
  return (
    <div className="rsv-person">
      <span className="rsv-avatar" aria-hidden="true">
        {person.avatarUrl ? <img src={person.avatarUrl} alt="" loading="lazy" /> : initialsOf(person.name) || '?'}
      </span>
      <div style={{ minWidth: 0 }}>
        <div className="rsv-person-name">
          {person.name}
          {person.verified && <BadgeCheck size={14} aria-label="verified" />}
        </div>
        {!!person.subtitle && <div className="rsv-person-sub">{person.subtitle}</div>}
      </div>
    </div>
  )
}

export function Media({ src, alt, size = 40 }: { src?: string | null; alt: string; size?: number }) {
  if (!src) {
    return (
      <span className="rsv-card-media-empty">
        <HomeIcon size={size} aria-hidden="true" />
      </span>
    )
  }
  return isVideoUrl(src) ? <VideoThumbnail src={src} alt={alt} className="video-thumbnail" /> : <img src={src} alt={alt} loading="lazy" />
}

// ---------------------------------------------------------------------------
// Reservation card
// ---------------------------------------------------------------------------

export interface ReservationCardProps {
  reservation: any
  variant: 'hero' | 'compact'
  statusLabel: string
  heroBadge?: string
  person?: PersonInfo
  schedule: { label: string; value: string }
  amount: { label: string; value: string }
  hint?: string
  deal?: React.ReactNode
  actions: CardAction[]
  footerAction?: CardAction
  splitActions?: boolean
  onOpen?: () => void
  openLabel?: string
}

export function ReservationCard({
  reservation,
  variant,
  statusLabel,
  heroBadge,
  person,
  schedule,
  amount,
  hint,
  deal,
  actions,
  footerAction,
  splitActions,
  onOpen,
  openLabel,
}: ReservationCardProps) {
  const image = reservation.property?.images?.[0]
  const title = reservation.property?.title || ''
  const location = reservation.property?.location || ''
  const tone = statusTone(reservation.status)

  const actionRow = actions.length > 0 && (
    <div className={`rsv-actions${splitActions ? ' rsv-actions--split' : ''}`}>
      {actions.map(({ key, ...action }) => (
        <CardButton key={key} {...action} />
      ))}
    </div>
  )

  if (variant === 'hero') {
    return (
      <article className="rsv-card">
        <button type="button" className="rsv-card-media" onClick={onOpen} disabled={!onOpen} aria-label={openLabel || title}>
          <Media src={image} alt={title} />
          <span className="rsv-overlay">
            <span className="rsv-overlay-pill" style={{ color: tone.text }}>
              <span className="rsv-dot" style={{ background: tone.dot }} />
              {heroBadge || statusLabel}
            </span>
            <span className="rsv-overlay-pill">{reservationRef(reservation.id)}</span>
          </span>
        </button>
        <div className="rsv-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <h3 className="rsv-card-title rsv-card-title--hero">{title}</h3>
            {!!location && (
              <div className="rsv-location">
                <MapPin size={14} color="var(--rsv-primary)" aria-hidden="true" />
                <span>{location}</span>
              </div>
            )}
          </div>
          {person && <PersonStrip person={person} />}
          <div className="rsv-meta">
            <div>
              <span className="rsv-meta-label">
                <CalendarClock size={13} color="var(--rsv-primary)" aria-hidden="true" />
                {schedule.label}
              </span>
              <span className="rsv-meta-value">{schedule.value}</span>
            </div>
            <div>
              <span className="rsv-meta-label">
                <ShieldCheck size={13} color="var(--rsv-success)" aria-hidden="true" />
                {amount.label}
              </span>
              <span className="rsv-meta-value">{amount.value}</span>
            </div>
          </div>
          {!!hint && <Hint text={hint} />}
          {deal}
          {actionRow}
          {footerAction && <CardButton {...footerAction} block />}
        </div>
      </article>
    )
  }

  return (
    <article className="rsv-card">
      <div className="rsv-body">
        <button type="button" className="rsv-compact-top" onClick={onOpen} disabled={!onOpen} aria-label={openLabel || title}>
          <span className="rsv-thumb">
            <Media src={image} alt={title} size={26} />
          </span>
          <span className="rsv-info">
            <span className="rsv-pill-row">
              <StatusPill tone={tone} label={statusLabel} />
              <span className="rsv-ref">{reservationRef(reservation.id)}</span>
            </span>
            <span className="rsv-card-title">{title}</span>
            {!!location && (
              <span className="rsv-location">
                <MapPin size={12} aria-hidden="true" />
                <span>{location}</span>
              </span>
            )}
            <span className="rsv-inline-meta">
              <strong>{schedule.value}</strong>
              {'  ·  '}
              {amount.value}
            </span>
          </span>
        </button>
        {person && <PersonStrip person={person} />}
        {!!hint && <Hint text={hint} />}
        {deal}
        {actionRow}
      </div>
    </article>
  )
}

// ---------------------------------------------------------------------------
// Empty state (design language: icon tile, title, one sentence, one action).
// Self-contained styles so it works on any page, not only inside ReservationsPage.
// ---------------------------------------------------------------------------

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
  compact,
}: {
  icon: LucideIcon
  title: string
  body?: string
  action?: { label: string; onClick: () => void; icon?: LucideIcon }
  /** Smaller variant for use inside a page section. */
  compact?: boolean
}) {
  const ActionIcon = action?.icon
  return (
    <div className={`ds-empty${compact ? ' ds-empty--compact' : ''}`}>
      <span className="ds-empty-icon" aria-hidden="true">
        <Icon size={compact ? 28 : 38} />
      </span>
      <h3 className="ds-empty-title">{title}</h3>
      {body && <p className="ds-empty-body">{body}</p>}
      {action && (
        <button type="button" className="ds-empty-action" onClick={action.onClick}>
          {ActionIcon && <ActionIcon size={16} aria-hidden="true" />}
          {action.label}
        </button>
      )}
    </div>
  )
}
