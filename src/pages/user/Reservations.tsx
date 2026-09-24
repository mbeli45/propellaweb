import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/I18nContext'
import { useDialog } from '@/contexts/DialogContext'
import { useReservations } from '@/hooks/useReservations'
import { useReservationDeals, dealNeedsAction } from '@/hooks/useReservationDeals'
import { useFapshiPayment } from '@/hooks/useFapshiPayment'
import { useBadgeCounts } from '@/hooks/useBadgeCounts'
import {
  CalendarClock,
  CheckCircle2,
  Compass,
  Eye,
  HeartHandshake as Handshake,
  History,
  MapPin,
  MessageCircle,
  Navigation,
  RotateCcw,
  Star,
  X,
} from 'lucide-react'
import { statusLabel as dealStatusLabel } from '@/lib/deals'
import ReviewModal from '@/components/ReviewModal'
import CommissionPaymentModal from '@/components/CommissionPaymentModal'
import { ReservationCardSkeleton } from '@/components/skeletons'
import {
  Banner,
  CardAction,
  CardButton,
  DealStrip,
  PaymentMonitorBanner,
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

export default function UserReservations() {
  const { user } = useAuth()
  const { t, currentLanguage } = useLanguage()
  const { confirm, alert } = useDialog()
  const navigate = useNavigate()
  const locale = currentLanguage === 'fr' ? 'fr-FR' : 'en-US'

  const {
    reservations,
    loading,
    error,
    cancelReservation,
    completeReservation,
    requestRefund,
    refreshReservations,
  } = useReservations(user?.id || '')
  const reservationDeals = useReservationDeals(user?.id)

  const { clearReservationBadge } = useBadgeCounts(user?.id || '', user?.role)
  const { isMonitoring, monitoringProgress, currentStatus, timeRemaining } = useFapshiPayment()

  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [requestingRefund, setRequestingRefund] = useState<string | null>(null)
  const [completingVisit, setCompletingVisit] = useState<string | null>(null)
  const [reviewReservation, setReviewReservation] = useState<any>(null)
  // Only a review offered straight after completing a visit leads on to the
  // commission prompt; rating an older visit from "Past visits" does not.
  const [reviewLeadsToCommission, setReviewLeadsToCommission] = useState(false)
  const [commissionReservation, setCommissionReservation] = useState<any>(null)

  const visibleReservations = useMemo(() => reservations.filter(reservation => {
    const query = search.trim().toLocaleLowerCase()
    const matchesFilter =
      statusFilter === 'all' ||
      (statusFilter === 'today' ? sectionOf(reservation) === 'today' : reservation.status === statusFilter)
    return matchesFilter && (!query ||
      [reservation.property?.title, reservation.property?.location, reservation.id, reservationRef(reservation.id)]
        .some(value => value?.toLocaleLowerCase().includes(query)))
  }), [reservations, statusFilter, search])

  const groups = useMemo(() => groupReservations(visibleReservations), [visibleReservations])

  const filterOptions = useMemo(() => [
    { key: 'all', label: t('reservations.filterAll'), count: reservations.length },
    { key: 'today', label: t('reservations.filterToday'), count: reservations.filter(r => sectionOf(r) === 'today').length },
    ...STATUS_FILTERS.map(status => ({
      key: status,
      label: t(`reservations.${status}`),
      count: reservations.filter(r => r.status === status).length,
    })),
  ], [reservations, t])

  // Mirrors the mobile gate: a paid, confirmed booking whose visit day has
  // arrived. reservation_date is a DATE, so it parses as UTC midnight - the
  // button appears from the start of the visit day rather than after it.
  const canCompleteVisit = (reservation: any) =>
    reservation.status === 'confirmed' &&
    new Date() >= new Date(reservation.reservation_date)

  useEffect(() => {
    if (user?.id) {
      clearReservationBadge()
      refreshReservations()
    }
  }, [user?.id, clearReservationBadge, refreshReservations])

  // Status strings come from the database, so fall back to the raw value
  // rather than rendering a missing translation key.
  const statusLabel = (status: string) => {
    const key = `reservations.${status}`
    const label = t(key)
    return label === key ? status.charAt(0).toUpperCase() + status.slice(1) : label
  }

  const handleCancel = async (reservationId: string) => {
    const confirmed = await confirm({
      title: t('reservations.cancelReservation') || 'Cancel Reservation',
      message: t('reservations.cancelReservationMessage') || 'Are you sure you want to cancel this reservation?',
      variant: 'warning',
    })
    if (!confirmed) return
    try {
      await cancelReservation(reservationId)
      alert(t('reservations.reservationCancelledSuccess') || 'Reservation cancelled successfully', 'success')
      refreshReservations()
    } catch (error: any) {
      alert(error.message || t('reservations.failedToCancelReservationMessage') || 'Failed to cancel reservation', 'error')
    }
  }

  const handleRequestRefund = async (reservationId: string) => {
    const confirmed = await confirm({
      title: t('reservations.requestRefund') || 'Request Refund',
      message: t('reservations.requestRefundConfirmMessage') || t('reservations.requestRefundMessage') || 'Are you sure you want to request a refund for this reservation?',
      variant: 'warning',
    })
    if (!confirmed) return
    setRequestingRefund(reservationId)
    try {
      await requestRefund(reservationId)
      alert(t('reservations.refundRequestedMessage') || 'Refund requested successfully', 'success')
      refreshReservations()
    } catch (error: any) {
      alert(error.message || t('reservations.failedToRequestRefundMessage') || 'Failed to request refund', 'error')
    } finally {
      setRequestingRefund(null)
    }
  }

  // Completing is the action; rating is what you are offered afterwards. The
  // review must never gate completion - that is what kept agents' funds locked.
  const handleCompleteVisit = async (reservation: any) => {
    const confirmed = await confirm({
      title: t('reservations.completeVisitTitle'),
      message: t('reservations.completeVisitMessage'),
      variant: 'info',
    })
    if (!confirmed) return

    setCompletingVisit(reservation.id)
    try {
      await completeReservation(reservation.id)
      refreshReservations()
      reservationDeals.refresh()
      // Offer the rating. Declining leaves the visit completed.
      setReviewLeadsToCommission(true)
      setReviewReservation(reservation)
    } catch (error: any) {
      // The thrown message is a Postgres/PostgREST string, not something to
      // put in front of a visitor in either language.
      console.error('[Reservations] Failed to complete visit', error)
      alert(t('reservations.failedToCompleteVisitMessage'), 'error', t('reservations.errorTitle'))
    } finally {
      setCompletingVisit(null)
    }
  }

  // After completing, submitted or declined, the next step is the commission
  // prompt. Rating an older visit ends here.
  const handleReviewClosed = () => {
    const reviewed = reviewReservation
    setReviewReservation(null)
    if (reviewed && reviewLeadsToCommission) setCommissionReservation(reviewed)
  }

  const propertyIdOf = (reservation: any) => reservation.property?.id || reservation.property_id || null

  // A booked listing is hidden from the public feed, so this card is the only
  // route back to it - and to the agent holding the visit.
  const handleMessageAgent = (reservation: any) => {
    const ownerId = reservation.property?.owner_id
    if (!ownerId) {
      alert(t('reservations.agentUnavailable'), 'error', t('reservations.errorTitle'))
      return
    }
    const propertyId = propertyIdOf(reservation)
    navigate(propertyId ? `/chat/${ownerId}?propertyId=${propertyId}` : `/chat/${ownerId}`)
  }

  const handleDirections = (reservation: any) => {
    const location = reservation.property?.location
    if (!location) return
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`, '_blank', 'noopener')
  }

  const openDeal = (reservationId?: string) =>
    navigate(reservationId ? `/user/deals?reservation=${reservationId}` : '/user/deals')

  const amountLabel = (reservation: any) => {
    if (reservation.status === 'completed') return t('reservations.paid')
    if (reservation.status === 'confirmed') return t('reservations.paidHeld')
    if (reservation.status === 'pending' && reservation.payment_status !== 'paid') return t('reservations.paymentPending')
    return t('reservations.paid')
  }

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

  const actionsFor = (reservation: any): { actions: CardAction[]; split?: boolean; hint?: string } => {
    const messageAgent: CardAction = {
      key: 'message',
      label: t('reservations.messageAgent'),
      icon: MessageCircle,
      tone: 'secondary',
      onClick: () => handleMessageAgent(reservation),
    }
    const propertyId = propertyIdOf(reservation)
    const viewDetails: CardAction | null = propertyId
      ? { key: 'details', label: t('reservations.viewDetails'), icon: Eye, tone: 'neutral', onClick: () => navigate(`/property/${propertyId}`) }
      : null
    const list = (...actions: (CardAction | null)[]) => actions.filter(Boolean) as CardAction[]

    switch (reservation.status) {
      case 'confirmed':
        if (canCompleteVisit(reservation)) {
          return {
            actions: [
              {
                key: 'complete',
                label: t('reservations.completeVisit'),
                icon: CheckCircle2,
                tone: 'primary',
                onClick: () => handleCompleteVisit(reservation),
                busy: completingVisit === reservation.id,
              },
              { ...messageAgent, tone: 'neutral' },
            ],
          }
        }
        // The visit day has not arrived, so completing is not yet possible.
        // Say so - the agent's fee stays locked until this happens.
        return { actions: list(messageAgent, viewDetails), hint: t('reservations.completeAvailableOnVisitDay') }
      case 'pending':
        return {
          split: true,
          hint: t('reservations.awaitingAgentHint'),
          actions: [
            { key: 'cancel', label: t('reservations.cancelRequest'), icon: X, tone: 'danger', onClick: () => handleCancel(reservation.id) },
            { ...messageAgent, tone: 'neutral' },
          ],
        }
      case 'completed':
        return {
          actions: list(
            {
              key: 'rate',
              label: t('reservations.rateExperience'),
              icon: Star,
              tone: 'secondary',
              onClick: () => {
                setReviewLeadsToCommission(false)
                setReviewReservation(reservation)
              },
            },
            viewDetails,
          ),
        }
      case 'cancelled':
        if (reservation.payment_status === 'paid' && !reservation.refund_requested) {
          return {
            actions: list(
              {
                key: 'refund',
                label: t('reservations.requestRefund'),
                icon: RotateCcw,
                tone: 'secondary',
                onClick: () => handleRequestRefund(reservation.id),
                disabled: !!requestingRefund && requestingRefund !== reservation.id,
                busy: requestingRefund === reservation.id,
              },
              viewDetails,
            ),
          }
        }
        return {
          actions: list(viewDetails),
          hint: reservation.refund_requested ? t('reservations.refundRequestedShort') : undefined,
        }
      default:
        return { actions: list(viewDetails) }
    }
  }

  const renderCard = (reservation: any, variant: 'hero' | 'compact') => {
    const { actions, split, hint } = actionsFor(reservation)
    const owner = reservation.property?.owner
    const propertyId = propertyIdOf(reservation)
    return (
      <ReservationCard
        key={reservation.id}
        reservation={reservation}
        variant={variant}
        statusLabel={statusLabel(reservation.status)}
        heroBadge={isVisitToday(reservation) ? t('reservations.heroToday') : t('reservations.heroDue')}
        person={variant === 'hero' ? {
          name: owner?.full_name || t('reservations.agentFallback'),
          subtitle: owner?.is_verified_agent ? t('reservations.verifiedAgent') : t('reservations.listingAgent'),
          avatarUrl: typeof owner?.avatar_url === 'string' ? owner.avatar_url : null,
          verified: !!owner?.is_verified_agent,
        } : undefined}
        schedule={{ label: t('reservations.scheduled'), value: formatVisitSlot(reservation, locale) }}
        amount={{ label: amountLabel(reservation), value: formatFcfa(reservation.amount) }}
        hint={hint}
        deal={renderDeal(reservation)}
        actions={actions}
        splitActions={split}
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
    <ReservationsPage label={t('reservations.myReservations')}>
      <ReservationsHeader
        title={t('reservations.myReservations')}
        onBack={(window.history.state?.idx ?? 0) > 0 ? () => navigate(-1) : undefined}
        backLabel={t('common.back')}
        count={reservations.length}
        subtitle={t('reservations.pageSubtitle')}
        action={{
          label: t('reservations.dealsButton'),
          icon: Handshake,
          badge: reservationDeals.needsActionCount,
          onClick: () => openDeal(),
        }}
      />

      {reservations.length > 0 && (
        <ReservationToolbar
          search={search}
          onSearch={setSearch}
          placeholder={t('reservations.searchPlaceholder')}
          options={filterOptions}
          value={statusFilter}
          onChange={setStatusFilter}
          label={t('reservations.myReservations')}
        />
      )}

      {isMonitoring && (
        <PaymentMonitorBanner
          title={t('reservations.paymentMonitoring')}
          status={currentStatus}
          progress={monitoringProgress}
          message={t('reservations.automaticallyChecking')}
          timeLeft={timeRemaining}
        />
      )}

      {/* The header's Deals button is the permanent entry point; the banner only
          appears when a deal is waiting on the customer. */}
      {reservationDeals.needsActionCount > 0 && (
        <Banner
          icon={Handshake}
          title={t('reservations.dealsTitle')}
          body={t('reservations.dealsBodyActive', { count: reservationDeals.activeCount })}
          attention={t('reservations.dealsNeedAction', { count: reservationDeals.needsActionCount })}
          primary={{ label: t('reservations.myDeals'), onClick: () => openDeal() }}
          secondary={{ label: t('reservations.requestProperty'), onClick: () => navigate('/user/deals?request=1') }}
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
          <span className="rsv-empty-icon" aria-hidden="true"><CalendarClock size={40} /></span>
          <h2>{t('reservations.noReservationsYetTitle')}</h2>
          <p>{t('reservations.noReservationsYetMessage')}</p>
          <CardButton label={t('reservations.newVisit')} icon={Compass} tone="primary" onClick={() => navigate('/user/explore')} />
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
              {groups.today.map(r => renderCard(r, 'hero'))}
            </ReservationSectionView>
          )}
          {groups.upcoming.length > 0 && (
            <ReservationSectionView icon={CalendarClock} title={t('reservations.sectionUpcoming')} meta={t('reservations.sectionCount', { count: groups.upcoming.length })}>
              {groups.upcoming.map(r => renderCard(r, 'compact'))}
            </ReservationSectionView>
          )}
          {groups.past.length > 0 && (
            <ReservationSectionView icon={History} title={t('reservations.sectionPast')} meta={t('reservations.sectionCount', { count: groups.past.length })}>
              {groups.past.map(r => renderCard(r, 'compact'))}
            </ReservationSectionView>
          )}
        </>
      )}

      <ReviewModal
        visible={!!reviewReservation}
        reservation={reviewReservation}
        userId={user?.id || ''}
        onClose={handleReviewClosed}
      />

      {commissionReservation && (
        <CommissionPaymentModal
          visible={!!commissionReservation}
          onClose={() => setCommissionReservation(null)}
          reservation={commissionReservation}
          agentName={commissionReservation.property?.owner?.full_name || t('reservations.agentFallback')}
          propertyTitle={commissionReservation.property?.title || t('reservations.propertyLabel')}
          onPaymentSuccess={() => {
            setCommissionReservation(null)
            refreshReservations()
            reservationDeals.refresh()
          }}
        />
      )}
    </ReservationsPage>
  )
}
