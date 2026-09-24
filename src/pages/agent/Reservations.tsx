import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarClock, Eye, HeartHandshake as Handshake, History, Home as HomeIcon, MapPin, MessageCircle, Navigation } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/I18nContext'
import { useAgentPropertyReservations } from '@/hooks/useReservations'
import { useReservationDeals, dealNeedsAction } from '@/hooks/useReservationDeals'
import { statusLabel as dealStatusLabel } from '@/lib/deals'
import SectionSwitch from '@/components/SectionSwitch'
import { ReservationCardSkeleton } from '@/components/skeletons'
import {
  Banner,
  CardAction,
  CardButton,
  DealStrip,
  ReservationCard,
  ReservationSectionView,
  ReservationToolbar,
  ReservationsHeader,
  ReservationsPage,
  formatFcfa,
  formatVisitSlot,
  groupReservations,
  isVisitToday,
  reservationRef,
  sectionOf,
} from '@/components/reservations/ReservationUI'

const STATUS_FILTERS = ['confirmed', 'pending', 'completed', 'cancelled'] as const

export default function AgentReservations() {
  const { user } = useAuth()
  const { t, currentLanguage } = useLanguage()
  const navigate = useNavigate()
  const locale = currentLanguage === 'fr' ? 'fr-FR' : 'en-US'

  // The query joins each visitor's profile (name, email, phone, avatar), so no
  // per-reservation profile lookups are needed.
  const { reservations, loading, error, refetch } = useAgentPropertyReservations(user?.id || '')
  const reservationDeals = useReservationDeals(user?.id)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (user?.id) refetch()
  }, [user?.id, refetch])

  const visibleReservations = useMemo(() => reservations.filter((reservation: any) => {
    const query = search.trim().toLocaleLowerCase()
    const matchesFilter =
      statusFilter === 'all' ||
      (statusFilter === 'today' ? sectionOf(reservation) === 'today' : reservation.status === statusFilter)
    return matchesFilter && (!query ||
      [
        reservation.property?.title,
        reservation.property?.location,
        reservation.user?.full_name,
        reservation.user?.email,
        reservation.user?.phone,
        reservation.id,
        reservationRef(reservation.id),
      ].some((value: string | undefined) => value?.toLocaleLowerCase().includes(query)))
  }), [reservations, statusFilter, search])

  const groups = useMemo(() => groupReservations(visibleReservations), [visibleReservations])

  const filterOptions = useMemo(() => [
    { key: 'all', label: t('reservations.filterAll'), count: reservations.length },
    { key: 'today', label: t('reservations.filterToday'), count: reservations.filter((r: any) => sectionOf(r) === 'today').length },
    ...STATUS_FILTERS.map(status => ({
      key: status,
      label: t(`reservations.${status}`),
      count: reservations.filter((r: any) => r.status === status).length,
    })),
  ], [reservations, t])

  const statusLabel = (status: string) => {
    const key = `reservations.${status}`
    const label = t(key)
    return label === key ? status.charAt(0).toUpperCase() + status.slice(1) : label
  }

  const paymentLabel = (reservation: any) => {
    if (reservation.payment_status === 'failed') return t('reservations.failed')
    if (reservation.payment_status === 'pending') return t('reservations.paymentPending')
    return t('reservations.paid')
  }

  const propertyIdOf = (reservation: any) => reservation.property?.id || reservation.property_id || null

  const handleDirections = (reservation: any) => {
    const location = reservation.property?.location
    if (!location) return
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`, '_blank', 'noopener')
  }

  const openDeal = (reservationId?: string) =>
    navigate(reservationId ? `/agent/deals?reservation=${reservationId}` : '/agent/deals')

  const renderDeal = (reservation: any) => {
    const deal = reservationDeals.byReservation.get(reservation.id)
    if (!deal) return undefined
    const attention = !!user?.id && dealNeedsAction(deal, user.id)
    return (
      <DealStrip
        icon={Handshake}
        label={t('reservations.dealLabel')}
        status={dealStatusLabel(deal.status)}
        actionLabel={attention ? t('reservations.dealActionNeeded') : t('reservations.trackDeal')}
        attention={attention}
        onClick={() => openDeal(reservation.id)}
      />
    )
  }

  const renderCard = (reservation: any, variant: 'hero' | 'compact') => {
    const propertyId = propertyIdOf(reservation)
    const actions: CardAction[] = []
    if (reservation.user_id) {
      actions.push({
        key: 'message',
        label: t('agentReservations.messageVisitor'),
        icon: MessageCircle,
        tone: variant === 'hero' ? 'primary' : 'secondary',
        onClick: () => navigate(`/agent/messages/${reservation.user_id}`),
      })
    }
    if (propertyId) {
      actions.push({ key: 'listing', label: t('reservations.viewDetails'), icon: Eye, tone: 'neutral', onClick: () => navigate(`/property/${propertyId}`) })
    }
    // Agents cannot complete a visit - the visitor does, and that is what
    // releases the agent's share of the fee - so explain rather than offer it.
    const hint =
      reservation.status === 'confirmed'
        ? t('agentReservations.completionHint')
        : reservation.status === 'pending'
          ? t('agentReservations.pendingHint')
          : undefined

    return (
      <ReservationCard
        key={reservation.id}
        reservation={reservation}
        variant={variant}
        statusLabel={statusLabel(reservation.status)}
        heroBadge={isVisitToday(reservation) ? t('reservations.heroToday') : t('reservations.heroDue')}
        person={{
          name: reservation.user?.full_name || t('reservations.unknownUser'),
          subtitle: reservation.user?.phone || reservation.user?.email || t('agentReservations.visitor'),
          avatarUrl: typeof reservation.user?.avatar_url === 'string' ? reservation.user.avatar_url : null,
        }}
        schedule={{ label: t('reservations.scheduled'), value: formatVisitSlot(reservation, locale) }}
        amount={{ label: paymentLabel(reservation), value: formatFcfa(reservation.amount) }}
        hint={hint}
        deal={renderDeal(reservation)}
        actions={actions}
        footerAction={variant === 'hero' && reservation.property?.location ? {
          key: 'directions',
          label: t('reservations.getDirections'),
          icon: Navigation,
          tone: 'ghost',
          onClick: () => handleDirections(reservation),
        } : undefined}
        onOpen={propertyId ? () => navigate(`/property/${propertyId}`) : undefined}
      />
    )
  }

  const showSkeleton = loading && reservations.length === 0

  return (
    <ReservationsPage label={t('agentReservations.pageTitle')}>
      <ReservationsHeader
        title={t('agentReservations.pageTitle')}
        onBack={(window.history.state?.idx ?? 0) > 0 ? () => navigate(-1) : undefined}
        backLabel={t('common.back')}
        count={reservations.length}
        subtitle={t('agentReservations.subtitle')}
      >
        {/* Deals share the Bookings tab; the badge counts deals waiting on the agent. */}
        <SectionSwitch
          label={t('navigation.bookings')}
          items={[
            { to: '/agent/reservations', label: t('navigation.bookings') },
            { to: '/agent/deals', label: t('reservations.dealsButton'), badge: reservationDeals.needsActionCount },
          ]}
        />
      </ReservationsHeader>

      {reservations.length > 0 && (
        <ReservationToolbar
          search={search}
          onSearch={setSearch}
          placeholder={t('reservations.searchPlaceholder')}
          options={filterOptions}
          value={statusFilter}
          onChange={setStatusFilter}
          label={t('agentReservations.pageTitle')}
        />
      )}

      {reservationDeals.needsActionCount > 0 && (
        <Banner
          icon={Handshake}
          title={t('agentReservations.dealsTitle')}
          body={t('agentReservations.dealsBodyActive', { count: reservationDeals.activeCount })}
          attention={t('reservations.dealsNeedAction', { count: reservationDeals.needsActionCount })}
          primary={{ label: t('agentReservations.openDeals'), onClick: () => openDeal() }}
        />
      )}

      {showSkeleton ? (
        <div style={{ marginTop: 20 }}>
          <ReservationCardSkeleton count={3} />
        </div>
      ) : error && reservations.length === 0 ? (
        <p className="rsv-error" role="alert">{error}</p>
      ) : reservations.length === 0 ? (
        <div className="rsv-empty">
          <span className="rsv-empty-icon" aria-hidden="true"><CalendarClock size={40} strokeWidth={1.5} /></span>
          <h2>{t('agentReservations.emptyBookingsTitle')}</h2>
          <p>{t('agentReservations.emptyBookingsBody')}</p>
          <CardButton label={t('agentReservations.myListings')} icon={HomeIcon} tone="primary" onClick={() => navigate('/agent')} />
        </div>
      ) : visibleReservations.length === 0 ? (
        <div className="rsv-empty">
          <p>{t('reservations.noMatches')}</p>
          <CardButton label={t('reservations.filterAll')} tone="ghost" onClick={() => { setSearch(''); setStatusFilter('all') }} />
        </div>
      ) : (
        <>
          {groups.today.length > 0 && (
            <ReservationSectionView icon={MapPin} title={t('reservations.sectionToday')} live={t('reservations.liveToday')} hero>
              {groups.today.map((r: any) => renderCard(r, 'hero'))}
            </ReservationSectionView>
          )}
          {groups.upcoming.length > 0 && (
            <ReservationSectionView icon={CalendarClock} title={t('reservations.sectionUpcoming')} meta={t('reservations.sectionCount', { count: groups.upcoming.length })}>
              {groups.upcoming.map((r: any) => renderCard(r, 'compact'))}
            </ReservationSectionView>
          )}
          {groups.past.length > 0 && (
            <ReservationSectionView icon={History} title={t('reservations.sectionPast')} meta={t('reservations.sectionCount', { count: groups.past.length })}>
              {groups.past.map((r: any) => renderCard(r, 'compact'))}
            </ReservationSectionView>
          )}
        </>
      )}
    </ReservationsPage>
  )
}
