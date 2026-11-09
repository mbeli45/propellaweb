import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BedDouble, Building2, CalendarCheck, CalendarDays, ChevronRight, Check, MessageCircle, Plus, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/I18nContext'
import { ListItemSkeleton } from '@/components/skeletons'
import { EmptyState, ReservationSectionView, ReservationsHeader, ReservationsPage } from '@/components/reservations/ReservationUI'
import type { CardAction } from '@/components/reservations/ReservationUI'
import { StayBookingCard, formatFcfa } from '@/components/stays/StayUI'
import {
  StayBooking,
  displayStatus,
  fetchHostBookings,
  fetchHostStayProperties,
  isHolding,
  respondStayBooking,
  stayDb,
  stayErrorMessage,
  todayISO,
} from '@/lib/stays'

type HostProperty = Awaited<ReturnType<typeof fetchHostStayProperties>>[number]

export default function HostStays() {
  const { user } = useAuth()
  const { t, currentLanguage } = useLanguage()
  const navigate = useNavigate()
  const locale = currentLanguage === 'fr' ? 'fr-FR' : 'en-GB'
  const [properties, setProperties] = useState<HostProperty[] | null>(null)
  const [bookings, setBookings] = useState<StayBooking[]>([])
  const [tonight, setTonight] = useState<Record<string, { total: number; taken: number }>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user?.id) return
    try {
      const props = await fetchHostStayProperties(user.id)
      const ids = props.map((p) => p.id)
      const today = todayISO()
      const [list, rooms, occupied] = await Promise.all([
        fetchHostBookings(ids),
        ids.length ? stayDb.from('stay_rooms').select('id,property_id').in('property_id', ids).eq('active', true) : Promise.resolve({ data: [] }),
        ids.length
          ? stayDb.from('stay_bookings').select('room_id,property_id,status,expires_at,payment_status,payment_due_at').in('property_id', ids).in('status', ['pending', 'confirmed']).lte('check_in', today).gt('check_out', today)
          : Promise.resolve({ data: [] }),
      ])
      const counts: Record<string, { total: number; taken: number }> = {}
      ids.forEach((id) => (counts[id] = { total: 0, taken: 0 }))
      ;((rooms as { data: any[] | null }).data || []).forEach((r) => counts[r.property_id] && counts[r.property_id].total++)
      const taken = new Set<string>()
      ;((occupied as { data: any[] | null }).data || []).filter(isHolding).forEach((b) => {
        if (!taken.has(b.room_id)) {
          taken.add(b.room_id)
          if (counts[b.property_id]) counts[b.property_id].taken++
        }
      })
      setProperties(props)
      setBookings(list)
      setTonight(counts)
    } catch (e) {
      setProperties((p) => p || [])
      setError(stayErrorMessage(e, t('stays.errors.generic')))
    }
  }, [user?.id, t])

  useEffect(() => {
    load()
  }, [load])

  const groups = useMemo(() => {
    const today = todayISO()
    return {
      pending: bookings.filter((b) => displayStatus(b) === 'pending'),
      arrivals: bookings.filter((b) => b.status === 'confirmed' && isHolding(b) && b.check_in === today),
      upcoming: bookings.filter((b) => b.status === 'confirmed' && isHolding(b) && b.check_in > today).slice(0, 20),
    }
  }, [bookings])

  const respond = async (b: StayBooking, decision: 'confirm' | 'decline') => {
    if (decision === 'decline' && !window.confirm(t('stays.declineConfirmTitle'))) return
    setBusy(`${b.id}:${decision}`)
    setError(null)
    try {
      await respondStayBooking(b.id, decision)
    } catch (e) {
      setError(stayErrorMessage(e, t('stays.errors.generic')))
    } finally {
      setBusy(null)
      load()
    }
  }

  const requestActions = (b: StayBooking): CardAction[] => [
    { key: 'decline', label: t('stays.decline'), icon: X, tone: 'neutral', onClick: () => respond(b, 'decline'), busy: busy === `${b.id}:decline` },
    { key: 'confirm', label: t('stays.confirm'), icon: Check, tone: 'primary', onClick: () => respond(b, 'confirm'), busy: busy === `${b.id}:confirm` },
  ]
  const messageAction = (b: StayBooking): CardAction[] =>
    b.guest_id ? [{ key: 'msg', label: t('stays.messageGuest'), icon: MessageCircle, tone: 'secondary', onClick: () => navigate(`/chat/${b.guest_id}?propertyId=${b.property_id}`) }] : []

  const cards = (list: StayBooking[], actions: (b: StayBooking) => CardAction[]) =>
    list.map((b) => (
      <StayBookingCard
        key={b.id}
        booking={b}
        t={t}
        locale={locale}
        perspective="host"
        actions={actions(b)}
        onOpen={() => navigate(`/agent/stays/manage/${b.property_id}?tab=bookings`)}
      />
    ))

  const listStay = () => navigate('/agent/property/add?type=stay')

  return (
    <ReservationsPage label={t('stays.hub.title')}>
      <ReservationsHeader
        title={t('stays.hub.title')}
        count={properties?.length || 0}
        subtitle={t('stays.hub.subtitle')}
        action={{ label: t('stays.hub.listStay'), icon: Plus, onClick: listStay }}
      />
      {error && <p className="rsv-error" role="alert">{error}</p>}
      {properties === null ? (
        <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
          <ListItemSkeleton />
          <ListItemSkeleton />
        </div>
      ) : properties.length === 0 ? (
        <EmptyState icon={BedDouble} title={t('stays.hub.empty')} body={t('stays.hub.emptyBody')} action={{ label: t('stays.hub.listStay'), icon: Plus, onClick: listStay }} />
      ) : (
        <>
          {groups.pending.length > 0 && (
            <ReservationSectionView icon={CalendarCheck} title={t('stays.hub.requests')} meta={String(groups.pending.length)}>
              {cards(groups.pending, requestActions)}
            </ReservationSectionView>
          )}
          {groups.arrivals.length > 0 && (
            <ReservationSectionView icon={CalendarDays} title={t('stays.hub.arrivals')} live={String(groups.arrivals.length)}>
              {cards(groups.arrivals, messageAction)}
            </ReservationSectionView>
          )}
          <ReservationSectionView icon={Building2} title={t('stays.hub.properties')} meta={String(properties.length)}>
            {properties.map((p) => {
              const c = tonight[p.id] || { total: 0, taken: 0 }
              const ok = c.total > 0 && c.total - c.taken > 0 && !p.owner_review_pending
              return (
                <button
                  key={p.id}
                  type="button"
                  className="stay-prop"
                  onClick={() => navigate(`/agent/stays/manage/${p.id}?tab=${c.total ? 'calendar' : 'rooms'}`)}
                >
                  {p.images?.[0] ? <img src={p.images[0]} alt="" /> : <span className="stay-prop-ph"><BedDouble size={24} aria-hidden="true" /></span>}
                  <span className="stay-prop-info">
                    <span className="stay-prop-title">{p.title}</span>
                    <span className="stay-row-sub">{t('stays.fromPerNight', { price: formatFcfa(p.price) })}</span>
                    <span className={`stay-prop-state stay-prop-state--${ok ? 'ok' : 'warn'}`}>
                      {p.owner_review_pending
                        ? t('stays.hub.awaitingReview')
                        : c.total
                          ? t('stays.hub.freeTonight', { free: c.total - c.taken, total: c.total })
                          : t('stays.hub.noRooms')}
                    </span>
                  </span>
                  <ChevronRight size={18} aria-hidden="true" />
                </button>
              )
            })}
          </ReservationSectionView>
          {groups.upcoming.length > 0 && (
            <ReservationSectionView icon={CalendarDays} title={t('stays.hub.upcoming')} meta={String(groups.upcoming.length)}>
              {cards(groups.upcoming, messageAction)}
            </ReservationSectionView>
          )}
        </>
      )}
    </ReservationsPage>
  )
}
