import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { BedDouble, CalendarDays, CalendarX2, Check, ChevronLeft, ChevronRight, ListChecks, Loader2, MessageCircle, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useLanguage } from '@/contexts/I18nContext'
import { supabase } from '@/lib/supabase'
import { CardButton, EmptyState, Hint, PageHeader, ReservationSectionView, ReservationsPage, SegmentedControl } from '@/components/reservations/ReservationUI'
import type { CardAction } from '@/components/reservations/ReservationUI'
import { DayStrip, StayBookingCard, StayDialog, Stepper, depositNote, formatFcfa, guestsLabel, nightsLabel } from '@/components/stays/StayUI'
import {
  BlockReason,
  StayBooking,
  StayRoom,
  StayRoomType,
  addDays,
  addRooms,
  cancelStayBooking,
  coversNight,
  displayStatus,
  fetchHostBookings,
  fetchPropertyCalendar,
  fetchRoomSetup,
  formatStayRange,
  fromISODate,
  nightsBetween,
  removeRoom,
  removeRoomType,
  respondStayBooking,
  saveRoomType,
  setRoomAvailability,
  stayErrorMessage,
  suggestRoomLabels,
  todayISO,
} from '@/lib/stays'

type Tab = 'calendar' | 'rooms' | 'bookings'
const DAYS = 14
const REASONS: BlockReason[] = ['offline_booking', 'maintenance', 'other']

export default function ManageStay() {
  const { id } = useParams<{ id: string }>()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const { t, currentLanguage } = useLanguage()
  const locale = currentLanguage === 'fr' ? 'fr-FR' : 'en-GB'
  const tabParam = params.get('tab') as Tab | null
  const tab: Tab = tabParam && ['calendar', 'rooms', 'bookings'].includes(tabParam) ? tabParam : 'calendar'
  const setTab = (next: Tab) => setParams({ tab: next }, { replace: true })

  const [title, setTitle] = useState('')
  const [roomTypes, setRoomTypes] = useState<StayRoomType[]>([])
  const [rooms, setRooms] = useState<StayRoom[]>([])
  const [calendar, setCalendar] = useState<StayBooking[]>([])
  const [bookings, setBookings] = useState<StayBooking[]>([])
  const [start, setStart] = useState(todayISO())
  const [loaded, setLoaded] = useState(false)
  const [busyCell, setBusyCell] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [detail, setDetail] = useState<StayBooking | null>(null)
  const [typeEditor, setTypeEditor] = useState<Partial<StayRoomType> | null>(null)
  const [roomAdder, setRoomAdder] = useState<StayRoomType | null>(null)
  const [blocker, setBlocker] = useState(false)

  const today = todayISO()
  const days = useMemo(() => Array.from({ length: DAYS }, (_, i) => addDays(start, i)), [start])
  const activeTypes = roomTypes.filter((rt) => rt.active)
  const activeRooms = rooms.filter((r) => r.active)

  const loadSetup = useCallback(async () => {
    if (!id) return
    const setup = await fetchRoomSetup(id)
    setRoomTypes(setup.roomTypes)
    setRooms(setup.rooms)
  }, [id])
  const loadCalendar = useCallback(async () => {
    if (!id) return
    setCalendar(await fetchPropertyCalendar(id, start, addDays(start, DAYS)))
  }, [id, start])
  const loadBookings = useCallback(async () => {
    if (!id) return
    setBookings(await fetchHostBookings([id]))
  }, [id])

  useEffect(() => {
    if (!id) return
    supabase
      .from('properties')
      .select('title')
      .eq('id', id)
      .maybeSingle()
      .then(({ data }) => setTitle((data as { title?: string } | null)?.title || ''))
    Promise.all([loadSetup(), loadBookings()])
      .catch((e) => setError(stayErrorMessage(e, t('stays.errors.load'))))
      .finally(() => setLoaded(true))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])
  useEffect(() => {
    loadCalendar().catch((e) => setError(stayErrorMessage(e, t('stays.errors.load'))))
  }, [loadCalendar, t])

  const fail = (e: unknown) => setError(stayErrorMessage(e, t('stays.errors.generic')))
  const occupant = (roomId: string, day: string) => calendar.find((b) => b.room_id === roomId && coversNight(b, day))

  const toggleNight = async (room: StayRoom, day: string) => {
    const current = occupant(room.id, day)
    if (current?.kind === 'guest') {
      setDetail(current)
      return
    }
    setBusyCell(`${room.id}:${day}`)
    setError(null)
    try {
      await setRoomAvailability({ roomId: room.id, from: day, to: addDays(day, 1), available: !!current })
      await loadCalendar()
    } catch (e) {
      fail(e)
    } finally {
      setBusyCell(null)
    }
  }

  const respond = async (b: StayBooking, decision: 'confirm' | 'decline' | 'cancel') => {
    if (decision === 'decline' && !window.confirm(t('stays.declineConfirmTitle'))) return
    const refundNote = b.payment_status === 'paid' ? ` ${t('stays.deposit.hostCancelRefund', { amount: formatFcfa(b.deposit_amount) })}` : ''
    if (decision === 'cancel' && !window.confirm(`${t('stays.cancelConfirmTitle')}\n${t('stays.cancelConfirmBody')}${refundNote}`)) return
    setBusy(`${b.id}:${decision}`)
    setError(null)
    try {
      if (decision === 'cancel') await cancelStayBooking(b.id)
      else await respondStayBooking(b.id, decision)
      await Promise.all([loadBookings(), loadCalendar()])
    } catch (e) {
      fail(e)
    } finally {
      setBusy(null)
    }
  }

  const bookingActions = (b: StayBooking): CardAction[] => {
    const status = displayStatus(b)
    if (status === 'pending')
      return [
        { key: 'decline', label: t('stays.decline'), icon: X, tone: 'neutral', onClick: () => respond(b, 'decline'), busy: busy === `${b.id}:decline` },
        { key: 'confirm', label: t('stays.confirm'), icon: Check, tone: 'primary', onClick: () => respond(b, 'confirm'), busy: busy === `${b.id}:confirm` },
      ]
    if (status === 'awaiting_payment' || status === 'confirmed' || status === 'staying')
      return [
        ...(b.guest_id
          ? [{ key: 'msg', label: t('stays.messageGuest'), icon: MessageCircle, tone: 'secondary' as const, onClick: () => navigate(`/chat/${b.guest_id}?propertyId=${b.property_id}`) }]
          : []),
        { key: 'cancel', label: t('stays.cancel'), icon: X, tone: 'danger', onClick: () => respond(b, 'cancel'), busy: busy === `${b.id}:cancel` },
      ]
    return []
  }

  const deleteType = async (rt: StayRoomType) => {
    if (!window.confirm(`${t('stays.rooms.removeTypeConfirm')}\n${rt.name}`)) return
    try {
      if ((await removeRoomType(rt.id)) === 'archived') setNotice(`${rt.name}: ${t('stays.rooms.archived')}`)
      await Promise.all([loadSetup(), loadCalendar()])
    } catch (e) {
      fail(e)
    }
  }
  const deleteRoom = async (room: StayRoom) => {
    if (!window.confirm(t('stays.rooms.removeRoomConfirm', { label: room.label }))) return
    try {
      if ((await removeRoom(room.id)) === 'archived') setNotice(`${room.label}: ${t('stays.rooms.archived')}`)
      await Promise.all([loadSetup(), loadCalendar()])
    } catch (e) {
      fail(e)
    }
  }

  // ---------------------------------------------------------------- calendar
  const renderCalendar = () => {
    if (!activeRooms.length) {
      return (
        <EmptyState
          compact
          icon={CalendarDays}
          title={t('stays.calendar.noRooms')}
          action={{ label: t('stays.rooms.addType'), icon: Plus, onClick: () => { setTab('rooms'); setTypeEditor({ max_guests: 2 }) } }}
        />
      )
    }
    return (
      <div className="stay-stack">
        <Hint text={t('stays.calendar.hint')} />
        <div className="stay-legend">
          <span><i className="stay-swatch stay-cell" style={{ width: 14, height: 14 }} />{t('stays.calendar.free')}</span>
          <span><i className="stay-swatch stay-cell--block" />{t('stays.calendar.blocked')}</span>
          <span><i className="stay-swatch stay-cell--booked" />{t('stays.calendar.booked')}</span>
          <span><i className="stay-swatch stay-cell--pending" style={{ border: '1px solid #fbbf24' }} />{t('stays.calendar.pending')}</span>
        </div>
        <div className="stay-nav">
          <button type="button" onClick={() => setStart((s) => (addDays(s, -7) < today ? today : addDays(s, -7)))} disabled={start <= today} aria-label={t('stays.calendar.previous')}>
            <ChevronLeft size={22} />
          </button>
          <button type="button" onClick={() => setStart(today)}>
            {formatStayRange(days[0], addDays(days[DAYS - 1], 1), locale)}
          </button>
          <button type="button" onClick={() => setStart((s) => addDays(s, 7))} aria-label={t('stays.calendar.next')}>
            <ChevronRight size={22} />
          </button>
        </div>
        <div className="stay-grid-wrap">
          <table className="stay-grid">
            <thead>
              <tr>
                <th scope="col" className="stay-room-label"><span className="sr-only">{t('stays.block.room')}</span></th>
                {days.map((day) => {
                  const d = fromISODate(day)
                  return (
                    <th key={day} scope="col" className={day === today ? 'is-today' : undefined}>
                      {d.toLocaleDateString(locale, { weekday: 'short' }).slice(0, 3)}
                      <strong>{d.getDate()}</strong>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {activeTypes.map((rt) => (
                <React.Fragment key={rt.id}>
                  <tr className="stay-type-row">
                    <th colSpan={DAYS + 1} scope="rowgroup">{rt.name}</th>
                  </tr>
                  {activeRooms
                    .filter((r) => r.room_type_id === rt.id)
                    .map((r) => (
                      <tr key={r.id}>
                        <th scope="row" className="stay-room-label">{r.label}</th>
                        {days.map((day) => {
                          const b = occupant(r.id, day)
                          const key = `${r.id}:${day}`
                          const pending = b?.kind === 'guest' && b.status === 'pending'
                          const cls = !b ? '' : b.kind === 'block' ? ' stay-cell--block' : pending ? ' stay-cell--pending' : ' stay-cell--booked'
                          const state = !b ? t('stays.calendar.free') : b.kind === 'block' ? t('stays.calendar.blocked') : pending ? t('stays.calendar.pending') : t('stays.calendar.booked')
                          return (
                            <td key={day}>
                              <button
                                type="button"
                                className={`stay-cell${cls}`}
                                onClick={() => toggleNight(r, day)}
                                disabled={busyCell !== null}
                                aria-label={`${r.label}, ${fromISODate(day).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}: ${state}`}
                                title={b?.kind === 'block' && b.host_note ? b.host_note : b?.guest?.full_name || state}
                              >
                                {busyCell === key ? <Loader2 size={14} className="rsv-spin" aria-hidden="true" /> : b?.kind === 'block' ? <X size={14} aria-hidden="true" /> : null}
                              </button>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <CardButton label={t('stays.calendar.blockDates')} icon={CalendarX2} tone="secondary" onClick={() => setBlocker(true)} />
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------- rooms
  const renderRooms = () => (
    <div className="stay-stack">
      {roomTypes.length === 0 && <Hint text={t('stays.rooms.empty')} />}
      {roomTypes.map((rt) => {
        const typeRooms = rooms.filter((r) => r.room_type_id === rt.id && r.active)
        return (
          <div key={rt.id} className="stay-panel" style={rt.active ? undefined : { opacity: 0.6 }}>
            <div className="stay-type-head">
              <div>
                <div className="stay-row-title">
                  {rt.name}
                  {!rt.active ? ` · ${t('stays.rooms.hidden')}` : ''}
                </div>
                <div className="stay-row-sub">
                  {formatFcfa(rt.nightly_price)} / {t('stays.perNight')} · {t('stays.sleeps', { count: rt.max_guests })}
                  {rt.beds ? ` · ${rt.beds}` : ''}
                </div>
              </div>
              {rt.active && (
                <>
                  <button type="button" className="stay-icon-btn" onClick={() => setTypeEditor(rt)} aria-label={t('stays.rooms.editType')}>
                    <Pencil size={18} />
                  </button>
                  <button type="button" className="stay-icon-btn stay-icon-btn--danger" onClick={() => deleteType(rt)} aria-label={t('stays.rooms.remove')}>
                    <Trash2 size={18} />
                  </button>
                </>
              )}
            </div>
            {rt.active && (
              <>
                <p className="stay-label">{t('stays.rooms.rooms')} · {typeRooms.length}</p>
                {typeRooms.length === 0 ? (
                  <p className="stay-warn-text">{t('stays.rooms.noRoomsInType')}</p>
                ) : (
                  <div className="stay-chips">
                    {typeRooms.map((room) => (
                      <span key={room.id} className="stay-chip stay-chip--room">
                        {room.label}
                        <button type="button" className="stay-chip-remove" onClick={() => deleteRoom(room)} aria-label={t('stays.rooms.removeRoom', { label: room.label })} title={t('stays.rooms.removeRoom', { label: room.label })}>
                          <X size={12} aria-hidden="true" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div>
                  <CardButton label={t('stays.rooms.addRooms')} icon={Plus} tone="neutral" onClick={() => setRoomAdder(rt)} />
                </div>
              </>
            )}
          </div>
        )
      })}
      <div>
        <CardButton label={t('stays.rooms.addType')} icon={Plus} tone="primary" onClick={() => setTypeEditor({ max_guests: 2 })} />
      </div>
    </div>
  )

  // ---------------------------------------------------------------- bookings
  const renderBookings = () => {
    if (!bookings.length) return <EmptyState compact icon={ListChecks} title={t('stays.my.empty')} />
    const pending = bookings.filter((b) => displayStatus(b) === 'pending')
    const active = bookings.filter((b) => ['awaiting_payment', 'confirmed', 'staying'].includes(displayStatus(b)))
    const closed = bookings.filter((b) => !['pending', 'awaiting_payment', 'confirmed', 'staying'].includes(displayStatus(b)))
    const section = (label: string, list: StayBooking[]) =>
      list.length > 0 && (
        <ReservationSectionView title={label} meta={String(list.length)}>
          {list.map((b) => (
            <StayBookingCard key={b.id} booking={b} t={t} locale={locale} perspective="host" actions={bookingActions(b)} />
          ))}
        </ReservationSectionView>
      )
    return (
      <>
        {section(t('stays.hub.requests'), pending)}
        {section(t('stays.hub.upcoming'), active)}
        {section(t('stays.my.past'), closed)}
      </>
    )
  }

  const pendingCount = bookings.filter((b) => displayStatus(b) === 'pending').length

  return (
    <ReservationsPage label={title || t('stays.title')}>
      <PageHeader title={title || t('stays.title')} subtitle={t('stays.manageAvailability')} onBack={() => navigate(-1)} backLabel={t('common.back')} />
      <div className="stay-manage-bar">
        <SegmentedControl<Tab>
          label={t('stays.manageAvailability')}
          value={tab}
          onChange={setTab}
          options={[
            { value: 'calendar', label: t('stays.tabs.calendar'), icon: CalendarDays },
            { value: 'rooms', label: t('stays.tabs.rooms'), icon: BedDouble },
            { value: 'bookings', label: pendingCount ? `${t('stays.tabs.bookings')} (${pendingCount})` : t('stays.tabs.bookings'), icon: ListChecks },
          ]}
        />
        {id && <CardButton label={t('stays.editListing')} icon={Pencil} tone="neutral" onClick={() => navigate(`/agent/property/edit/${id}`)} />}
      </div>
      {error && <p className="rsv-error" role="alert" style={{ marginBottom: 12 }}>{error}</p>}
      {notice && <p className="stay-success" role="status" style={{ marginBottom: 12 }}>{notice}</p>}
      {!loaded ? null : tab === 'calendar' ? renderCalendar() : tab === 'rooms' ? renderRooms() : renderBookings()}

      {detail && (
        <StayDialog
          title={t(`stays.status.${displayStatus(detail)}`)}
          onClose={() => setDetail(null)}
          closeLabel={t('common.close')}
          footer={
            <>
              <CardButton label={t('common.close')} tone="neutral" onClick={() => setDetail(null)} />
              <CardButton label={t('stays.tabs.bookings')} tone="primary" onClick={() => { setDetail(null); setTab('bookings') }} />
            </>
          }
        >
          <dl className="stay-facts">
            <div><dt>{t('stays.detail.guest')}</dt><dd>{detail.guest?.full_name || '—'}{detail.guest?.phone ? ` · ${detail.guest.phone}` : ''}</dd></div>
            <div><dt>{t('stays.detail.dates')}</dt><dd>{formatStayRange(detail.check_in, detail.check_out, locale)} ({nightsLabel(t, nightsBetween(detail.check_in, detail.check_out))})</dd></div>
            <div><dt>{t('stays.detail.room')}</dt><dd>{detail.room_type?.name} · {detail.room?.label}</dd></div>
            <div><dt>{t('stays.guests')}</dt><dd>{guestsLabel(t, detail.guests)}</dd><strong>{formatFcfa(detail.total_amount)}</strong></div>
          </dl>
          {(() => {
            const note = depositNote(detail, 'host', t, locale)
            return note && <p className={`stay-deposit stay-deposit--${note.tone}`} style={{ marginTop: 12 }}>{note.text}</p>
          })()}
          {detail.guest_note && <p className="stay-note">“{detail.guest_note}”</p>}
        </StayDialog>
      )}
      {typeEditor && id && (
        <RoomTypeEditor
          propertyId={id}
          value={typeEditor}
          existingLabels={rooms.map((r) => r.label)}
          sortOrder={roomTypes.length}
          onClose={() => setTypeEditor(null)}
          onSaved={async () => {
            setTypeEditor(null)
            await Promise.all([loadSetup(), loadCalendar()])
          }}
        />
      )}
      {roomAdder && id && (
        <RoomAdder
          propertyId={id}
          roomType={roomAdder}
          existingLabels={rooms.map((r) => r.label)}
          onClose={() => setRoomAdder(null)}
          onSaved={async () => {
            setRoomAdder(null)
            await Promise.all([loadSetup(), loadCalendar()])
          }}
        />
      )}
      {blocker && (
        <BlockDialog
          rooms={activeRooms}
          roomTypes={activeTypes}
          locale={locale}
          onClose={() => setBlocker(false)}
          onSaved={async (count) => {
            setBlocker(false)
            setNotice(count > 0 ? t(count === 1 ? 'stays.block.done_one' : 'stays.block.done_other', { count }) : t('stays.block.nothingFree'))
            await loadCalendar()
          }}
        />
      )}
    </ReservationsPage>
  )
}

// ---------------------------------------------------------------------------
// Dialogs
// ---------------------------------------------------------------------------

function RoomTypeEditor({
  propertyId,
  value,
  existingLabels,
  sortOrder,
  onClose,
  onSaved,
}: {
  propertyId: string
  value: Partial<StayRoomType>
  existingLabels: string[]
  sortOrder: number
  onClose: () => void
  onSaved: () => void
}) {
  const { t } = useLanguage()
  const isNew = !value.id
  const [name, setName] = useState(value.name || '')
  const [price, setPrice] = useState(value.nightly_price ? String(value.nightly_price) : '')
  const [maxGuests, setMaxGuests] = useState(value.max_guests || 2)
  const [beds, setBeds] = useState(value.beds || '')
  const [description, setDescription] = useState(value.description || '')
  const [count, setCount] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = async () => {
    const nightly = Number(price.replace(/\D/g, ''))
    if (name.trim().length < 2) return setError(t('stays.errors.name'))
    if (!nightly || nightly < 500) return setError(t('stays.errors.price'))
    setSaving(true)
    setError(null)
    try {
      const saved = await saveRoomType(propertyId, { id: value.id, name, nightly_price: nightly, max_guests: maxGuests, beds, description, sort_order: value.sort_order ?? sortOrder })
      if (isNew && count > 0) await addRooms(propertyId, saved.id, suggestRoomLabels(existingLabels, count))
      onSaved()
    } catch (e) {
      setError(stayErrorMessage(e, t('stays.errors.generic')))
    } finally {
      setSaving(false)
    }
  }

  return (
    <StayDialog
      title={isNew ? t('stays.rooms.addType') : t('stays.rooms.editType')}
      onClose={onClose}
      closeLabel={t('common.close')}
      footer={<CardButton label={t('stays.rooms.save')} tone="primary" onClick={save} busy={saving} />}
    >
      <label className="rsv-field">
        {t('stays.rooms.name')}
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('stays.rooms.namePlaceholder')} maxLength={80} />
      </label>
      <label className="rsv-field">
        {t('stays.rooms.price')}
        <input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="numeric" placeholder="25000" />
      </label>
      <div className="rsv-field">
        {t('stays.rooms.maxGuests')}
        <Stepper value={maxGuests} min={1} max={20} onChange={setMaxGuests} label={t('stays.rooms.maxGuests')} />
      </div>
      <label className="rsv-field">
        {t('stays.rooms.beds')}
        <input value={beds} onChange={(e) => setBeds(e.target.value)} placeholder={t('stays.rooms.bedsPlaceholder')} maxLength={120} />
      </label>
      <label className="rsv-field">
        {t('stays.rooms.description')}
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1000} />
      </label>
      {isNew && (
        <div className="rsv-field">
          {t('stays.rooms.howMany')}
          <Stepper value={count} min={1} max={50} onChange={setCount} label={t('stays.rooms.howMany')} />
          <span className="stay-field-hint">{suggestRoomLabels(existingLabels, count).join(', ')}</span>
        </div>
      )}
      {error && <p className="stay-error" role="alert">{error}</p>}
    </StayDialog>
  )
}

function RoomAdder({
  propertyId,
  roomType,
  existingLabels,
  onClose,
  onSaved,
}: {
  propertyId: string
  roomType: StayRoomType
  existingLabels: string[]
  onClose: () => void
  onSaved: () => void
}) {
  const { t } = useLanguage()
  const [labels, setLabels] = useState(suggestRoomLabels(existingLabels, 1).join(', '))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const save = async () => {
    const list = Array.from(new Set(labels.split(',').map((l) => l.trim()).filter(Boolean)))
    if (!list.length) return
    const taken = list.filter((l) => existingLabels.some((x) => x.toLowerCase() === l.toLowerCase()))
    if (taken.length) return setError(t('stays.rooms.labelTaken', { labels: taken.join(', ') }))
    setSaving(true)
    setError(null)
    try {
      await addRooms(propertyId, roomType.id, list)
      onSaved()
    } catch (e) {
      setError(stayErrorMessage(e, t('stays.errors.generic')))
    } finally {
      setSaving(false)
    }
  }
  return (
    <StayDialog
      title={`${t('stays.rooms.addRooms')} · ${roomType.name}`}
      onClose={onClose}
      closeLabel={t('common.close')}
      footer={<CardButton label={t('stays.rooms.save')} tone="primary" onClick={save} busy={saving} />}
    >
      <label className="rsv-field">
        {t('stays.rooms.roomLabels')}
        <input value={labels} onChange={(e) => setLabels(e.target.value)} />
        <span className="stay-field-hint">{t('stays.rooms.roomLabelsHint')}</span>
      </label>
      {error && <p className="stay-error" role="alert">{error}</p>}
    </StayDialog>
  )
}

function BlockDialog({
  rooms,
  roomTypes,
  locale,
  onClose,
  onSaved,
}: {
  rooms: StayRoom[]
  roomTypes: StayRoomType[]
  locale: string
  onClose: () => void
  onSaved: (count: number) => void
}) {
  const { t } = useLanguage()
  const [selected, setSelected] = useState<string[]>(rooms[0] ? [rooms[0].id] : [])
  const [from, setFrom] = useState(todayISO())
  const [nights, setNights] = useState(1)
  const [reason, setReason] = useState<BlockReason>('offline_booking')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const save = async () => {
    if (!selected.length) return
    setSaving(true)
    setError(null)
    try {
      let total = 0
      for (const roomId of selected) {
        total += await setRoomAvailability({ roomId, from, to: addDays(from, nights), available: false, reason, note: note.trim() })
      }
      onSaved(total)
    } catch (e) {
      setError(stayErrorMessage(e, t('stays.errors.generic')))
    } finally {
      setSaving(false)
    }
  }
  return (
    <StayDialog
      title={t('stays.block.title')}
      onClose={onClose}
      closeLabel={t('common.close')}
      footer={<CardButton label={t('stays.block.markUnavailable')} tone="primary" onClick={save} busy={saving} disabled={!selected.length} />}
    >
      <div className="rsv-field">
        {t('stays.block.room')}
        {roomTypes.map((rt) => (
          <div key={rt.id} className="stay-stack" style={{ gap: 6 }}>
            <span className="stay-field-hint">{rt.name}</span>
            <div className="stay-chips">
              {rooms
                .filter((r) => r.room_type_id === rt.id)
                .map((r) => {
                  const active = selected.includes(r.id)
                  return (
                    <button
                      key={r.id}
                      type="button"
                      role="checkbox"
                      aria-checked={active}
                      className={`stay-chip${active ? ' is-active' : ''}`}
                      onClick={() => setSelected((s) => (active ? s.filter((x) => x !== r.id) : [...s, r.id]))}
                    >
                      {r.label}
                    </button>
                  )
                })}
            </div>
          </div>
        ))}
      </div>
      <div className="rsv-field">
        {t('stays.block.from')}
        <DayStrip start={todayISO()} days={90} value={from} onChange={setFrom} locale={locale} label={t('stays.block.from')} />
      </div>
      <div className="rsv-field">
        {t('stays.block.nights')}
        <Stepper value={nights} min={1} max={90} onChange={setNights} label={t('stays.block.nights')} />
        <span className="stay-field-hint">{formatStayRange(from, addDays(from, nights), locale)}</span>
      </div>
      <div className="rsv-field">
        {t('stays.block.reason')}
        <div className="stay-chips" role="radiogroup" aria-label={t('stays.block.reason')}>
          {REASONS.map((r) => (
            <button key={r} type="button" role="radio" aria-checked={reason === r} className={`stay-chip${reason === r ? ' is-active' : ''}`} onClick={() => setReason(r)}>
              {t(`stays.block.reasons.${r}`)}
            </button>
          ))}
        </div>
      </div>
      <label className="rsv-field">
        {t('stays.block.note')}
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('stays.block.notePlaceholder')} maxLength={500} />
      </label>
      {error && <p className="stay-error" role="alert">{error}</p>}
    </StayDialog>
  )
}
