import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { BedDouble, Check, Clock, MessageCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/I18nContext'
import { supabase } from '@/lib/supabase'
import { CardButton, EmptyState, Hint, PageHeader, ReservationSectionView, ReservationsPage } from '@/components/reservations/ReservationUI'
import { DayStrip, Stepper, formatFcfa, guestsLabel, nightsLabel, useStayBase } from '@/components/stays/StayUI'
import {
  NO_DEPOSIT_TERMS,
  RoomAvailability,
  StayTerms,
  addDays,
  fetchAvailability,
  fetchStayTerms,
  formatStayRange,
  formatTime,
  requestStayBooking,
  stayErrorMessage,
  stayQuote,
  todayISO,
} from '@/lib/stays'

interface StayProperty {
  id: string
  title: string
  location: string
  town: string | null
  owner_id: string
  check_in_time: string | null
  check_out_time: string | null
}

export default function BookStay() {
  const { id } = useParams<{ id: string }>()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t, currentLanguage } = useLanguage()
  const base = useStayBase()
  const locale = currentLanguage === 'fr' ? 'fr-FR' : 'en-GB'
  const initial = params.get('checkIn')

  const [property, setProperty] = useState<StayProperty | null>(null)
  const [checkIn, setCheckIn] = useState(initial && initial >= todayISO() ? initial : todayISO())
  // Home → Stays hands over the nights and party size the guest already picked.
  const [nights, setNights] = useState(() => Math.min(30, Math.max(1, Number(params.get('nights')) || 1)))
  const [guests, setGuests] = useState(() => Math.min(20, Math.max(1, Number(params.get('guests')) || 1)))
  const [rooms, setRooms] = useState<RoomAvailability[] | null>(null)
  // Arriving from "Select" on the stay page: that room type is already chosen,
  // so the page is a review step; "Change room" opens the full list.
  const roomParam = params.get('room')
  const [selected, setSelected] = useState<string | null>(roomParam)
  const [showAllRooms, setShowAllRooms] = useState(!roomParam)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [terms, setTerms] = useState<StayTerms>(NO_DEPOSIT_TERMS)
  useEffect(() => {
    fetchStayTerms().then(setTerms)
  }, [])
  const checkOut = addDays(checkIn, nights)

  useEffect(() => {
    if (!id) return
    supabase
      .from('properties')
      .select('id,title,location,town,owner_id,check_in_time,check_out_time')
      .eq('id', id)
      .maybeSingle()
      .then(({ data, error: e }) => {
        if (e || !data) setError(t('stays.errors.load'))
        else setProperty(data as unknown as StayProperty)
      })
  }, [id, t])

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const list = await fetchAvailability(id, checkIn, checkOut)
      setRooms(list)
      setSelected((current) => {
        const still = list.find((r) => r.room_type_id === current)
        const ok = !!still && still.available_rooms > 0 && still.max_guests >= guests
        // The chosen room no longer fits (dates or party changed): show every option.
        if (!ok) setShowAllRooms(true)
        return ok ? current : null
      })
    } catch (e) {
      setError(stayErrorMessage(e, t('stays.errors.load')))
    } finally {
      setLoading(false)
    }
  }, [id, checkIn, checkOut, guests, t])

  useEffect(() => {
    load()
  }, [load])

  const room = useMemo(() => rooms?.find((r) => r.room_type_id === selected) || null, [rooms, selected])
  const quote = room ? stayQuote(terms, room.nightly_price, nights) : null
  const maxGuests = useMemo(() => Math.max(1, ...(rooms || []).map((r) => r.max_guests)), [rooms])
  const isOwner = !!user && property?.owner_id === user.id

  const submit = async () => {
    if (!room) return
    if (!user) {
      navigate('/auth/login')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      // Instant booking: My stays opens the deposit sheet straight away when one is due.
      const id = await requestStayBooking({ roomTypeId: room.room_type_id, checkIn, checkOut, guests, note: note.trim() })
      navigate(`${base}/stays/my?booking=${id}&pay=1`)
    } catch (e) {
      setError(stayErrorMessage(e, t('stays.errors.generic')))
      load()
    } finally {
      setSubmitting(false)
    }
  }

  if (error && !property) {
    return (
      <ReservationsPage label={t('stays.bookTitle')}>
        <PageHeader title={t('stays.bookTitle')} onBack={() => navigate(-1)} backLabel={t('common.back')} />
        <EmptyState icon={BedDouble} title={error} />
      </ReservationsPage>
    )
  }

  const times = [
    property?.check_in_time && t('stays.checkInFrom', { time: formatTime(property.check_in_time) }),
    property?.check_out_time && t('stays.checkOutBy', { time: formatTime(property.check_out_time) }),
  ].filter(Boolean)

  return (
    <ReservationsPage label={t('stays.bookTitle')}>
      <PageHeader
        title={t('stays.bookTitle')}
        subtitle={property ? `${property.title} · ${property.town || property.location}` : undefined}
        onBack={() => navigate(-1)}
        backLabel={t('common.back')}
      />
      <div className="stay-layout">
        <div>
          <div className="stay-panel">
            <p className="stay-label">{t('stays.checkIn')}</p>
            <DayStrip start={todayISO()} days={60} value={checkIn} onChange={setCheckIn} locale={locale} label={t('stays.checkIn')} />
            <div className="stay-row">
              <div>
                <div className="stay-row-title">{nightsLabel(t, nights)}</div>
                <div className="stay-row-sub">{formatStayRange(checkIn, checkOut, locale)}</div>
              </div>
              <Stepper value={nights} min={1} max={30} onChange={setNights} label={t('stays.block.nights')} />
            </div>
            <div className="stay-row">
              <div className="stay-row-title">{guestsLabel(t, guests)}</div>
              <Stepper value={guests} min={1} max={Math.min(20, maxGuests)} onChange={setGuests} label={t('stays.guests')} />
            </div>
            {times.length > 0 && (
              <div className="stay-meta-line">
                <Clock size={14} aria-hidden="true" />
                {times.join(' · ')}
              </div>
            )}
          </div>

          <ReservationSectionView title={showAllRooms ? t('stays.selectRoom') : t('stays.yourRoom')} meta={loading ? t('stays.loadingRooms') : undefined}>
            {rooms === null ? null : rooms.length === 0 ? (
              <EmptyState
                compact
                icon={BedDouble}
                title={t('stays.noRoomsYet')}
                action={
                  property && !isOwner
                    ? { label: t('stays.messageHost'), icon: MessageCircle, onClick: () => navigate(`/chat/${property.owner_id}?propertyId=${property.id}`) }
                    : undefined
                }
              />
            ) : (
              rooms.filter((r) => showAllRooms || r.room_type_id === selected).map((r) => {
                const tooSmall = r.max_guests < guests
                const full = r.available_rooms <= 0
                const active = selected === r.room_type_id
                const leftClass = full ? 'none' : tooSmall ? 'muted' : r.available_rooms <= 2 ? 'low' : 'ok'
                return (
                  <button
                    key={r.room_type_id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    disabled={tooSmall || full}
                    className={`stay-room${active ? ' is-active' : ''}`}
                    onClick={() => setSelected(r.room_type_id)}
                  >
                    {!!r.images?.length && <img className="stay-room-photo" src={r.images[0]} alt={t('stays.rooms.photoAlt', { name: r.name, n: 1 })} loading="lazy" />}
                    <span className="stay-room-head">
                      <span>
                        <span className="stay-room-name">{r.name}</span>
                        <span className="stay-row-sub" style={{ display: 'block' }}>
                          {[r.beds, t('stays.sleeps', { count: r.max_guests })].filter(Boolean).join(' · ')}
                        </span>
                      </span>
                      {active && (
                        <span className="stay-room-check">
                          <Check size={15} aria-hidden="true" />
                        </span>
                      )}
                    </span>
                    {r.description && <span className="stay-room-desc">{r.description}</span>}
                    <span className="stay-room-foot">
                      <span className="stay-price">
                        {formatFcfa(r.nightly_price)} <small>/ {t('stays.perNight')}</small>
                      </span>
                      <span className={`stay-left stay-left--${leftClass}`}>
                        {full ? t('stays.full') : tooSmall ? t('stays.tooManyGuests', { count: r.max_guests }) : t('stays.roomsLeft', { count: r.available_rooms })}
                      </span>
                    </span>
                  </button>
                )
              })
            )}
            {!showAllRooms && rooms && rooms.length > 1 && (
              <div>
                <CardButton label={t('stays.changeRoom')} tone="neutral" onClick={() => setShowAllRooms(true)} />
              </div>
            )}
          </ReservationSectionView>
        </div>

        {!!rooms?.length && !isOwner && (
          <aside className="stay-panel stay-summary" aria-label={t('stays.total')}>
            <label className="rsv-field">
              {t('stays.noteLabel')}
              <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('stays.notePlaceholder')} maxLength={500} />
            </label>
            <div>
              <div className="stay-row-sub">
                {room ? t('stays.nightsTimesPrice', { nights, price: formatFcfa(room.nightly_price) }) : t('stays.selectRoom')}
              </div>
              <div className="stay-total">{room ? formatFcfa(room.nightly_price * nights) : '—'}</div>
            </div>
            {quote && quote.deposit > 0 && (
              <dl className="stay-breakdown">
                <div><dt>{t('stays.total')}</dt><dd>{formatFcfa(quote.total)}</dd></div>
                <div><dt>{t('stays.deposit.afterAccept')}</dt><dd>{formatFcfa(quote.deposit)}</dd></div>
                <div><dt>{t('stays.deposit.atProperty')}</dt><dd>{formatFcfa(quote.atProperty)}</dd></div>
              </dl>
            )}
            {error && <p className="stay-error" role="alert">{error}</p>}
            <CardButton
              label={!user ? t('stays.signInToBook') : quote && quote.deposit > 0 ? t('stays.instant.bookAndPay') : t('stays.instant.bookNow')}
              tone="primary"
              onClick={submit}
              disabled={!room}
              busy={submitting}
              block
            />
            {quote && quote.deposit > 0 ? (
              <>
                <Hint text={t('stays.deposit.bookNote')} />
                <p className="stay-policy">
                  {terms.free_cancel_days > 0 ? t('stays.deposit.policy', { days: terms.free_cancel_days }) : t('stays.deposit.policyNone')}
                </p>
              </>
            ) : (
              <Hint text={t('stays.payAtProperty')} />
            )}
            <Hint text={t('stays.instant.beforeBook')} />
          </aside>
        )}
      </div>
    </ReservationsPage>
  )
}
