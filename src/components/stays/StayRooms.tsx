import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BedDouble, CalendarDays, CheckCircle2, Clock, Info, Loader2, MessageCircle, Navigation, RefreshCw, Smartphone, Users, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/I18nContext'
import {
  NO_DEPOSIT_TERMS,
  RoomAvailability,
  StayBooking,
  StayTerms,
  addDays,
  awaitingDeposit,
  checkStayPayment,
  fetchAvailability,
  fetchStayBooking,
  fetchStayTerms,
  formatStayRange,
  requestStayBooking,
  stayErrorMessage,
  stayQuote,
  stayRef,
  todayISO,
} from '@/lib/stays'
import { DayStrip, Stepper, formatFcfa, guestsLabel, nightsLabel, useStayBase } from './StayUI'
import { DepositDialog } from './DepositDialog'

/** Room types shown before "Show all". */
const PREVIEW = 3

export interface StaySearch {
  checkIn: string
  nights: number
  guests: number
}

/** Dates and party size from the URL (Home → Stays hands them over). */
export function readStaySearch(params: URLSearchParams): StaySearch {
  const inParam = params.get('checkIn')
  return {
    checkIn: inParam && inParam >= todayISO() ? inParam : todayISO(),
    nights: Math.min(30, Math.max(1, Number(params.get('nights')) || 1)),
    guests: Math.min(20, Math.max(1, Number(params.get('guests')) || 1)),
  }
}

/**
 * The stay page's Rooms section: each room type with its price and what's free
 * for the guest's dates. Select opens booking right inside that card (note,
 * total, deposit and the request button) without leaving the page.
 */
export function StayRooms({
  propertyId,
  search,
  onSearchChange,
  onMessageHost,
  isOwner,
  directions,
}: {
  propertyId: string
  search: StaySearch
  onSearchChange: (next: StaySearch) => void
  onMessageHost?: () => void
  isOwner: boolean
  /** Where "Get directions" points: "lat,lng" or an address. */
  directions?: string
}) {
  const { t, currentLanguage } = useLanguage()
  const locale = currentLanguage === 'fr' ? 'fr-FR' : 'en-GB'
  const [rooms, setRooms] = useState<RoomAvailability[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [showAll, setShowAll] = useState(false)
  // The room type whose card is open for booking (one at a time).
  const [open, setOpen] = useState<string | null>(null)
  const [reload, setReload] = useState(0)
  const checkOut = addDays(search.checkIn, search.nights)

  useEffect(() => {
    let active = true
    setError(null)
    fetchAvailability(propertyId, search.checkIn, checkOut)
      .then((list) => active && setRooms(list))
      .catch((e) => active && setError(stayErrorMessage(e, t('stays.errors.load'))))
    return () => {
      active = false
    }
  }, [propertyId, search.checkIn, checkOut, t, reload])

  // New dates or party: an open card that no longer fits closes.
  useEffect(() => {
    if (!open || rooms === null) return
    const r = rooms.find((x) => x.room_type_id === open)
    if (!r || r.available_rooms <= 0 || r.max_guests < search.guests) setOpen(null)
  }, [rooms, open, search.guests])

  const maxGuests = Math.max(1, ...(rooms || []).map((r) => r.max_guests))
  // Room types that fit these dates and this party first; the first few are shown.
  const fits = (r: RoomAvailability) => r.available_rooms > 0 && r.max_guests >= search.guests
  const ordered = [...(rooms || [])].sort((a, b) => Number(fits(b)) - Number(fits(a)) || a.nightly_price - b.nightly_price)
  // The open card stays in the list even when it sits past the preview.
  const visible = showAll ? ordered : ordered.filter((r, i) => i < PREVIEW || r.room_type_id === open)
  const set = (patch: Partial<StaySearch>) => onSearchChange({ ...search, ...patch })

  return (
    <section className="pd-card stay-rooms" id="stay-rooms" aria-labelledby="stay-rooms-title">
      <h3 id="stay-rooms-title">{t('stays.roomsTitle')}</h3>

      {/* The search these prices are for, editable in place. */}
      <div className="stay-rooms-search">
        <span className="stay-rooms-search-item">
          <CalendarDays size={16} aria-hidden="true" />
          {formatStayRange(search.checkIn, checkOut, locale)} · {nightsLabel(t, search.nights)}
        </span>
        <span className="stay-rooms-search-item">
          <Users size={16} aria-hidden="true" />
          {guestsLabel(t, search.guests)}
        </span>
        <button type="button" className="stay-rooms-change" onClick={() => setEditing((v) => !v)} aria-expanded={editing}>
          {editing ? t('common.done', 'Done') : t('stays.changeSearch')}
        </button>
      </div>
      {editing && (
        <div className="stay-rooms-editor">
          <DayStrip start={todayISO()} days={60} value={search.checkIn} onChange={(d) => set({ checkIn: d })} locale={locale} label={t('stays.checkIn')} />
          <div className="stay-row">
            <div className="stay-row-title">{nightsLabel(t, search.nights)}</div>
            <Stepper value={search.nights} min={1} max={30} onChange={(n) => set({ nights: n })} label={t('stays.block.nights')} />
          </div>
          <div className="stay-row">
            <div className="stay-row-title">{guestsLabel(t, search.guests)}</div>
            <Stepper value={search.guests} min={1} max={Math.min(20, Math.max(maxGuests, search.guests))} onChange={(n) => set({ guests: n })} label={t('stays.guests')} />
          </div>
        </div>
      )}

      {error ? (
        <p className="stay-error" role="alert">{error}</p>
      ) : rooms === null ? (
        <p className="stay-rooms-quiet" aria-live="polite">{t('stays.loadingRooms')}</p>
      ) : rooms.length === 0 ? (
        <div className="stay-rooms-quiet">
          <p>{t('stays.noRoomsYet')}</p>
          {onMessageHost && !isOwner && (
            <button type="button" className="stay-rooms-change" onClick={onMessageHost}>
              <MessageCircle size={15} aria-hidden="true" /> {t('stays.messageHost')}
            </button>
          )}
        </div>
      ) : (
        <ul className="stay-rooms-list">
          {visible.map((r) => {
            const full = r.available_rooms <= 0
            const tooSmall = r.max_guests < search.guests
            const blocked = full || tooSmall
            const leftClass = full ? 'none' : tooSmall ? 'muted' : r.available_rooms <= 2 ? 'low' : 'ok'
            return (
              <li key={r.room_type_id} className={`stay-rooms-item${blocked ? ' is-blocked' : ''}${open === r.room_type_id ? ' is-open' : ''}`}>
                {!!r.images?.length && (
                  <div className="stay-rooms-photos" aria-label={t('stays.rooms.photosOf', { name: r.name })} role="group">
                    {r.images.map((src, i) => <img key={src} src={src} alt={t('stays.rooms.photoAlt', { name: r.name, n: i + 1 })} loading="lazy" />)}
                  </div>
                )}
                <div className="stay-rooms-body">
                <div className="stay-rooms-main">
                  <span className="stay-room-name">{r.name}</span>
                  <span className="stay-row-sub">
                    <BedDouble size={14} aria-hidden="true" />
                    {[r.beds, t('stays.sleeps', { count: r.max_guests })].filter(Boolean).join(' · ')}
                  </span>
                  {r.description && <p className="stay-room-desc">{r.description}</p>}
                </div>
                <div className="stay-rooms-side">
                  <span className="stay-price">
                    {formatFcfa(r.nightly_price)} <small>/ {t('stays.perNight')}</small>
                  </span>
                  {search.nights > 1 && !blocked && (
                    <span className="stay-row-sub">{t('stays.totalFor', { total: formatFcfa(r.nightly_price * search.nights), nights: nightsLabel(t, search.nights) })}</span>
                  )}
                  <span className={`stay-left stay-left--${leftClass}`}>
                    {full ? t('stays.fullForDates') : tooSmall ? t('stays.tooManyGuests', { count: r.max_guests }) : t('stays.roomsLeft', { count: r.available_rooms })}
                  </span>
                  {!isOwner && open !== r.room_type_id && (
                    <button
                      type="button"
                      className="stay-rooms-select"
                      onClick={() => setOpen(r.room_type_id)}
                      disabled={blocked}
                      aria-expanded={false}
                      aria-controls={`stay-book-${r.room_type_id}`}
                    >
                      {t('stays.selectThisRoom')}
                    </button>
                  )}
                </div>
                </div>
                {open === r.room_type_id && (
                  <RoomBooking
                    room={r}
                    search={search}
                    checkOut={checkOut}
                    locale={locale}
                    directions={directions}
                    onMessageHost={isOwner ? undefined : onMessageHost}
                    onClose={() => setOpen(null)}
                    onStale={() => setReload((n) => n + 1)}
                  />
                )}
              </li>
            )
          })}
        </ul>
      )}
      {!showAll && ordered.length > PREVIEW && (
        <button type="button" className="stay-rooms-more" onClick={() => setShowAll(true)}>
          {t('stays.showAllRooms', { count: ordered.length })}
        </button>
      )}
    </section>
  )
}

/**
 * Booking inside an open room card. A free room is booked straight away:
 * with a deposit the room is held while the guest pays, then confirmed.
 * Either way the guest is reminded to message the host.
 */
function RoomBooking({
  room,
  search,
  checkOut,
  locale,
  directions,
  onMessageHost,
  onClose,
  onStale,
}: {
  room: RoomAvailability
  search: StaySearch
  checkOut: string
  locale: string
  directions?: string
  onMessageHost?: () => void
  onClose: () => void
  onStale: () => void
}) {
  const { t } = useLanguage()
  const { user } = useAuth()
  const navigate = useNavigate()
  const base = useStayBase()
  const [terms, setTerms] = useState<StayTerms>(NO_DEPOSIT_TERMS)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  // Once booked the card turns into a receipt that follows the booking's state.
  const [booking, setBooking] = useState<StayBooking | null>(null)
  const [paying, setPaying] = useState(false)
  const [sentPayment, setSentPayment] = useState(false)
  const [checking, setChecking] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchStayTerms().then(setTerms)
  }, [])
  // Bring the opened panel into view and move focus to it for keyboard users.
  useEffect(() => {
    ref.current?.focus({ preventScroll: true })
    ref.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [])

  const quote = stayQuote(terms, room.nightly_price, search.nights)

  const submit = async () => {
    if (!user) {
      navigate('/auth/login')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const id = await requestStayBooking({ roomTypeId: room.room_type_id, checkIn: search.checkIn, checkOut, guests: search.guests, note: note.trim() })
      const created = await fetchStayBooking(id)
      setBooking(created)
      onStale()
      if (awaitingDeposit(created)) setPaying(true)
    } catch (e) {
      setError(stayErrorMessage(e, t('stays.errors.generic')))
      onStale()
    } finally {
      setSubmitting(false)
    }
  }

  const checkPayment = async () => {
    if (!booking) return
    setChecking(true)
    setError(null)
    try {
      const result = await checkStayPayment(booking.id)
      setInfo(result.status === 'successful' ? null : result.message)
      setBooking(await fetchStayBooking(booking.id))
    } catch (e) {
      setError(stayErrorMessage(e, t('stays.errors.generic')))
    } finally {
      setChecking(false)
    }
  }

  // Focus the receipt so screen readers announce it.
  useEffect(() => {
    if (booking) ref.current?.focus({ preventScroll: true })
  }, [booking?.id, booking?.payment_status, booking?.status])

  if (booking) {
    const held = awaitingDeposit(booking)
    // Requests made before instant booking (or while the database still runs the old flow).
    const request = booking.status === 'pending'
    const rest = Number(booking.total_amount) - Number(booking.deposit_amount)
    const due = booking.payment_due_at
      ? new Date(booking.payment_due_at).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
      : ''
    const title = request ? t('stays.requestSent') : held ? t('stays.instant.heldTitle') : t('stays.instant.bookedTitle')
    const body = request
      ? t('stays.receipt.body')
      : held
        ? t('stays.instant.heldBody', { amount: formatFcfa(booking.deposit_amount), time: due })
        : booking.payment_status === 'paid' || booking.payment_status === 'released'
          ? rest > 0 ? t('stays.instant.bookedPaid', { rest: formatFcfa(rest) }) : t('stays.instant.bookedPaidFull')
          : t('stays.instant.bookedNoDeposit')
    return (
      <div
        className={`stay-rooms-book stay-confirm${held ? ' is-held' : ''}`}
        id={`stay-book-${room.room_type_id}`}
        ref={ref}
        tabIndex={-1}
        role="status"
        aria-live="polite"
      >
        <div className="stay-confirm-head">
          {held ? <Clock size={28} aria-hidden="true" /> : <CheckCircle2 size={28} aria-hidden="true" />}
          <div>
            <strong>{title}</strong>
            <span>{body}</span>
          </div>
        </div>

        <div className="stay-confirm-ref">
          <span>{t('stays.receipt.bookingId')}</span>
          <strong>{stayRef(booking.id)}</strong>
        </div>

        <dl className="stay-rooms-book-sum">
          <div className="is-sub"><dt>{t('stays.detail.room')}</dt><dd>{room.name}</dd></div>
          <div className="is-sub"><dt>{t('stays.detail.dates')}</dt><dd>{formatStayRange(booking.check_in, booking.check_out, locale)}</dd></div>
          <div className="is-sub"><dt>{t('stays.receipt.stay')}</dt><dd>{nightsLabel(t, search.nights)} · {guestsLabel(t, booking.guests)}</dd></div>
          <div><dt>{t('stays.receipt.total')}</dt><dd>{formatFcfa(booking.total_amount)}</dd></div>
          {Number(booking.deposit_amount) > 0 && (
            <div className="is-sub"><dt>{t('stays.deposit.afterAccept')}</dt><dd>{formatFcfa(booking.deposit_amount)}</dd></div>
          )}
          {booking.guest_note && (
            <div className="is-sub stay-confirm-note"><dt>{t('stays.noteLabel')}</dt><dd>{booking.guest_note}</dd></div>
          )}
        </dl>

        {error && <p className="stay-error" role="alert">{error}</p>}
        {info && <p className="stay-rooms-book-note"><Info size={14} aria-hidden="true" /><span>{info}</span></p>}

        {held && (
          <div className="stay-confirm-actions">
            <button type="button" className="stay-rooms-select" onClick={() => setPaying(true)}>
              <Smartphone size={16} aria-hidden="true" /> {t('stays.instant.payDeposit', { amount: formatFcfa(booking.deposit_amount) })}
            </button>
            {sentPayment && (
              <button type="button" className="stay-confirm-directions" onClick={checkPayment} disabled={checking} aria-busy={checking}>
                {checking ? <Loader2 size={16} className="stay-rooms-spin" aria-hidden="true" /> : <RefreshCw size={16} aria-hidden="true" />}
                {t('stays.deposit.check')}
              </button>
            )}
          </div>
        )}

        {/* Free on the calendar is not a promise the host has seen it: ask them to confirm. */}
        {!request && onMessageHost && (
          <div className="stay-confirm-remind">
            <MessageCircle size={18} aria-hidden="true" />
            <div>
              <strong>{t('stays.instant.confirmTitle')}</strong>
              <span>{t('stays.instant.confirmBody')}</span>
            </div>
            <button type="button" onClick={onMessageHost}>{t('stays.messageHost')}</button>
          </div>
        )}

        <div className="stay-confirm-actions">
          <button
            type="button"
            className={held ? 'stay-confirm-directions' : 'stay-rooms-select'}
            onClick={() => navigate(`${base}/stays/my?booking=${booking.id}`)}
          >
            {t('stays.receipt.viewBooking')}
          </button>
          {directions && (
            <a
              className="stay-confirm-directions"
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(directions)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Navigation size={16} aria-hidden="true" /> {t('stays.receipt.directions')}
            </a>
          )}
        </div>

        {paying && held && (
          <DepositDialog
            booking={booking}
            defaultPhone={(user as { phone?: string | null } | null)?.phone}
            onClose={() => setPaying(false)}
            onSent={(message) => {
              setPaying(false)
              setSentPayment(true)
              setInfo(message || t('stays.instant.paymentPending'))
            }}
          />
        )}
      </div>
    )
  }

  return (
    <div
      className="stay-rooms-book"
      id={`stay-book-${room.room_type_id}`}
      ref={ref}
      tabIndex={-1}
      role="region"
      aria-label={t('stays.bookRoomLabel', { name: room.name })}
    >
      <div className="stay-rooms-book-head">
        <span>
          <strong>{formatStayRange(search.checkIn, checkOut, locale)}</strong>
          <span>{nightsLabel(t, search.nights)} · {guestsLabel(t, search.guests)}</span>
        </span>
        <button type="button" className="stay-rooms-book-close" onClick={onClose} aria-label={t('common.close', 'Close')}>
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      <label className="stay-rooms-book-field">
        {t('stays.noteLabel')}
        <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('stays.notePlaceholder')} maxLength={500} />
      </label>

      <dl className="stay-rooms-book-sum">
        <div>
          <dt>{t('stays.nightsTimesPrice', { nights: search.nights, price: formatFcfa(room.nightly_price) })}</dt>
          <dd>{formatFcfa(quote.total)}</dd>
        </div>
        {quote.deposit > 0 && (
          <>
            <div className="is-sub"><dt>{t('stays.deposit.afterAccept')}</dt><dd>{formatFcfa(quote.deposit)}</dd></div>
            <div className="is-sub"><dt>{t('stays.deposit.atProperty')}</dt><dd>{formatFcfa(quote.atProperty)}</dd></div>
          </>
        )}
      </dl>

      {error && <p className="stay-error" role="alert">{error}</p>}

      <button type="button" className="stay-rooms-select stay-rooms-book-go" onClick={submit} disabled={submitting} aria-busy={submitting}>
        {submitting && <Loader2 size={16} className="stay-rooms-spin" aria-hidden="true" />}
        {!user ? t('stays.signInToBook') : quote.deposit > 0 ? t('stays.instant.bookAndPay') : t('stays.instant.bookNow')}
      </button>

      <p className="stay-rooms-book-note">
        <Info size={14} aria-hidden="true" />
        <span>
          {quote.deposit > 0
            ? `${t('stays.deposit.bookNote')} ${terms.free_cancel_days > 0 ? t('stays.deposit.policy', { days: terms.free_cancel_days }) : t('stays.deposit.policyNone')}`
            : t('stays.payAtProperty')}
        </span>
      </p>
      <p className="stay-rooms-book-note">
        <MessageCircle size={14} aria-hidden="true" />
        <span>{t('stays.instant.beforeBook')}</span>
      </p>
    </div>
  )
}
