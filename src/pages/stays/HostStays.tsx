import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BedDouble, Building2, ShieldCheck, Wallet, CalendarCheck, CalendarDays, ChevronRight, Check, MessageCircle, Plus, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/I18nContext'
import { ListItemSkeleton } from '@/components/skeletons'
import { Banner, EmptyState, ReservationSectionView, ReservationsHeader, ReservationsPage } from '@/components/reservations/ReservationUI'
import { useIdentityGate } from '@/hooks/useIdentityGate'
import type { CardAction } from '@/components/reservations/ReservationUI'
import { StayBookingCard } from '@/components/stays/StayUI'
import PropertyCard, { PropertyData } from '@/components/PropertyCard'
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

/** A host's stay in the shape the shared listing card expects. */
const toCardProperty = (p: HostProperty): PropertyData => ({
  id: p.id,
  title: p.title,
  price: p.price,
  location: p.location,
  town: p.town || undefined,
  image: p.images?.[0] || '',
  images: p.images || [],
  type: 'stay',
  category: (p.category as PropertyData['category']) || 'standard',
  status: p.status || undefined,
  owner_id: p.owner_id,
  owner_review_pending: p.owner_review_pending,
  stay_kind: p.stay_kind,
  amenities: p.amenities || [],
  check_in_time: p.check_in_time,
  check_out_time: p.check_out_time,
  availability_confirmed_at: p.availability_confirmed_at,
} as PropertyData)

/**
 * The host's dashboard: requests to answer, today's arrivals, each stay with
 * rooms free tonight, and what's coming. `asHome` is a Host account's /agent page.
 */
export default function HostStays({ asHome = false }: { asHome?: boolean }) {
  const identity = useIdentityGate()
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

  // Headline numbers for the stats row.
  const roomTotals = Object.values(tonight).reduce((acc, c) => ({ total: acc.total + c.total, taken: acc.taken + c.taken }), { total: 0, taken: 0 })
  const freeTonight = roomTotals.total - roomTotals.taken
  const jump = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const stats = [
    {
      key: 'free', icon: BedDouble, label: t('stays.hub.statFree'),
      value: roomTotals.total ? String(freeTonight) : '–',
      sub: roomTotals.total ? t('stays.hub.ofRooms', { total: roomTotals.total }) : t('stays.hub.noRoomsYet'),
      tone: roomTotals.total && freeTonight === 0 ? 'warn' : 'plain', onClick: () => jump('host-properties'),
    },
    {
      key: 'requests', icon: CalendarCheck, label: t('stays.hub.requests'), value: String(groups.pending.length),
      sub: groups.pending.length ? t('stays.hub.replySoon') : t('stays.hub.allCaught'),
      tone: groups.pending.length ? 'attention' : 'plain', onClick: () => jump('host-today'),
    },
    {
      key: 'arrivals', icon: CalendarDays, label: t('stays.hub.arrivals'), value: String(groups.arrivals.length),
      sub: t('stays.hub.todayLabel'), tone: 'plain', onClick: () => jump('host-today'),
    },
    {
      key: 'upcoming', icon: CalendarDays, label: t('stays.hub.upcoming'), value: String(groups.upcoming.length),
      sub: t('stays.hub.confirmedLabel'), tone: 'plain', onClick: () => jump('host-upcoming'),
    },
  ] as const

  return (
    <ReservationsPage label={t('stays.hub.title')}>
      <div className="host-dash">
        <ReservationsHeader
          title={t('stays.hub.title')}
          count={properties?.length || 0}
          subtitle={t('stays.hub.subtitle')}
          action={{ label: t('stays.hub.listStay'), icon: Plus, onClick: listStay }}
        />
        {asHome && identity.stage === 'needed' && (
          <Banner
            icon={ShieldCheck}
            title={identity.state?.status === 'rejected' ? t('identity.progressRejected') : t('identity.progressTitle')}
            body={identity.state?.status === 'rejected' ? identity.state?.rejection_reason || t('identity.rejectedBody') : t('stays.hub.idBody')}
            attention={identity.state?.status === 'rejected' ? t('identity.needsYou') : undefined}
            primary={{ label: t('identity.verifyCta'), onClick: () => navigate('/agent/identity') }}
          />
        )}
        {asHome && identity.stage === 'review' && (
          <Banner icon={ShieldCheck} title={t('identity.progressReview')} body={t('identity.underReview')}
            primary={{ label: t('identity.statusAction'), onClick: () => navigate('/agent/identity') }} />
        )}
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
            <div className="host-stats">
              {stats.map(({ key, icon: Icon, label, value, sub, tone, onClick }) => (
                <button key={key} type="button" className={`host-stat host-stat--${tone}`} onClick={onClick}>
                  <span className="host-stat-label"><Icon size={16} aria-hidden="true" />{label}</span>
                  <span className="host-stat-value">{value}</span>
                  <span className="host-stat-sub">{sub}</span>
                </button>
              ))}
              {asHome && (
                <button type="button" className="host-stat host-stat--wallet" onClick={() => navigate('/agent/wallet')}>
                  <span className="host-stat-label"><Wallet size={16} aria-hidden="true" />{t('navigation.wallet')}</span>
                  <span className="host-stat-value host-stat-value--link">{t('stays.hub.openWallet')} <ChevronRight size={18} aria-hidden="true" /></span>
                  <span className="host-stat-sub">{t('stays.hub.walletHint')}</span>
                </button>
              )}
            </div>

            <div className="host-grid">
              {/* Today: what needs the host now. Beside the listings on wide screens, first on phones. */}
              <aside className="host-today" id="host-today" aria-label={t('stays.hub.todayLabel')}>
                <ReservationSectionView icon={CalendarCheck} title={t('stays.hub.requests')} meta={String(groups.pending.length)}>
                  {groups.pending.length ? cards(groups.pending, requestActions) : <p className="host-quiet">{t('stays.hub.allCaughtBody')}</p>}
                </ReservationSectionView>
                <ReservationSectionView icon={CalendarDays} title={t('stays.hub.arrivals')} live={groups.arrivals.length ? String(groups.arrivals.length) : undefined}>
                  {groups.arrivals.length ? cards(groups.arrivals, messageAction) : <p className="host-quiet">{t('stays.hub.noArrivals')}</p>}
                </ReservationSectionView>
              </aside>

              <div className="host-main">
                <div id="host-properties">
                  <ReservationSectionView icon={Building2} title={t('stays.hub.properties')} meta={String(properties.length)}>
                    {/* Same card agents see on their listings; tap opens the rooms calendar. */}
                    <div className="stay-prop-grid">
                      {properties.map((p) => {
                        const c = tonight[p.id] || { total: 0, taken: 0 }
                        const ok = c.total > 0 && c.total - c.taken > 0 && !p.owner_review_pending
                        const manage = (tab: 'calendar' | 'rooms') => navigate(`/agent/stays/manage/${p.id}?tab=${tab}`)
                        return (
                          <div key={p.id} className="stay-prop-card">
                            <PropertyCard
                              property={toCardProperty(p)}
                              isOwner
                              onEdit={() => navigate(`/agent/property/edit/${p.id}`)}
                              onClick={() => manage(c.total ? 'calendar' : 'rooms')}
                            />
                            <div className="host-prop-foot">
                              <span className={`host-prop-state host-prop-state--${ok ? 'ok' : 'warn'}`}>
                                <span className="host-prop-dot" aria-hidden="true" />
                                {p.owner_review_pending
                                  ? t('stays.hub.awaitingReview')
                                  : c.total
                                    ? t('stays.hub.freeTonight', { free: c.total - c.taken, total: c.total })
                                    : t('stays.hub.noRooms')}
                              </span>
                              <div className="host-prop-actions">
                                <button type="button" onClick={() => manage('rooms')}><BedDouble size={15} aria-hidden="true" />{t('stays.tabs.rooms')}</button>
                                <button type="button" onClick={() => manage('calendar')}><CalendarDays size={15} aria-hidden="true" />{t('stays.tabs.calendar')}</button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                      <button type="button" className="host-add" onClick={listStay}>
                        <span className="host-add-icon"><Plus size={22} aria-hidden="true" /></span>
                        <strong>{t('stays.hub.listStay')}</strong>
                        <span>{t('stays.hub.addAnother')}</span>
                      </button>
                    </div>
                  </ReservationSectionView>
                </div>

                <div id="host-upcoming">
                  <ReservationSectionView icon={CalendarDays} title={t('stays.hub.upcoming')} meta={String(groups.upcoming.length)}>
                    {groups.upcoming.length ? <div className="host-booking-grid">{cards(groups.upcoming, messageAction)}</div> : <p className="host-quiet">{t('stays.hub.noUpcoming')}</p>}
                  </ReservationSectionView>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </ReservationsPage>
  )
}
