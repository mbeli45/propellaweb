import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { BedDouble, CalendarDays, History, MessageCircle, RefreshCw, Search, Smartphone, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/I18nContext'
import { ListItemSkeleton } from '@/components/skeletons'
import { EmptyState, ReservationSectionView, ReservationsHeader, ReservationsPage } from '@/components/reservations/ReservationUI'
import type { CardAction } from '@/components/reservations/ReservationUI'
import { StayBookingCard, formatFcfa, useStayBase } from '@/components/stays/StayUI'
import { DepositDialog } from '@/components/stays/DepositDialog'
import {
  NO_DEPOSIT_TERMS,
  StayBooking,
  StayTerms,
  cancelStayBooking,
  checkStayPayment,
  displayStatus,
  fetchMyStays,
  fetchStayTerms,
  nightsBetween,
  stayErrorMessage,
  todayISO,
} from '@/lib/stays'

const ACTIVE = ['pending', 'awaiting_payment', 'confirmed', 'staying']

export default function MyStays() {
  const { user } = useAuth()
  const { t, currentLanguage } = useLanguage()
  const navigate = useNavigate()
  const base = useStayBase()
  const [params, setParams] = useSearchParams()
  const locale = currentLanguage === 'fr' ? 'fr-FR' : 'en-GB'
  const [bookings, setBookings] = useState<StayBooking[] | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [paying, setPaying] = useState<StayBooking | null>(null)
  const [terms, setTerms] = useState<StayTerms>(NO_DEPOSIT_TERMS)
  const sent = params.get('sent') === '1'
  const focusId = params.get('booking')

  const load = useCallback(async () => {
    if (!user?.id) return
    try {
      setBookings(await fetchMyStays(user.id))
    } catch (e) {
      setBookings((b) => b || [])
      setError(stayErrorMessage(e, t('stays.errors.generic')))
    }
  }, [user?.id, t])

  useEffect(() => {
    load()
  }, [load])
  useEffect(() => {
    fetchStayTerms().then(setTerms)
  }, [])
  // Arriving from a booking confirmation: bring that booking into view.
  useEffect(() => {
    if (!focusId || !bookings) return
    document.getElementById(`stay-${focusId}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [focusId, bookings])

  const { upcoming, past } = useMemo(() => {
    const today = todayISO()
    const list = bookings || []
    const active = (b: StayBooking) => ACTIVE.includes(displayStatus(b)) && b.check_out > today
    return {
      upcoming: list.filter(active).sort((a, b) => a.check_in.localeCompare(b.check_in)),
      past: list.filter((b) => !active(b)),
    }
  }, [bookings])

  const cancelBody = (b: StayBooking) => {
    if (b.payment_status !== 'paid') return t('stays.cancelConfirmBody')
    const amount = formatFcfa(b.deposit_amount)
    return nightsBetween(todayISO(), b.check_in) >= terms.free_cancel_days
      ? `${t('stays.cancelConfirmBody')} ${t('stays.deposit.cancelRefund', { amount })}`
      : `${t('stays.cancelConfirmBody')} ${t('stays.deposit.cancelKeep', { amount, days: terms.free_cancel_days })}`
  }

  const checkPayment = async (b: StayBooking) => {
    setBusy(`${b.id}:check`)
    setError(null)
    try {
      const result = await checkStayPayment(b.id)
      setInfo(result.message)
      await load()
    } catch (e) {
      setError(stayErrorMessage(e, t('stays.errors.generic')))
    } finally {
      setBusy(null)
    }
  }

  const cancel = async (b: StayBooking) => {
    if (!window.confirm(`${t('stays.cancelConfirmTitle')}\n${cancelBody(b)}`)) return
    setBusy(b.id)
    setError(null)
    try {
      await cancelStayBooking(b.id)
      await load()
    } catch (e) {
      setError(stayErrorMessage(e, t('stays.errors.generic')))
    } finally {
      setBusy(null)
    }
  }

  const actionsFor = (b: StayBooking): CardAction[] => {
    const status = displayStatus(b)
    const list: CardAction[] = []
    if (status === 'awaiting_payment') {
      list.push({ key: 'pay', label: t('stays.deposit.payNow'), icon: Smartphone, tone: 'primary', onClick: () => setPaying(b) })
      list.push({ key: 'check', label: t('stays.deposit.check'), icon: RefreshCw, tone: 'secondary', onClick: () => checkPayment(b), busy: busy === `${b.id}:check` })
    }
    if (b.property?.owner_id && ['pending', 'confirmed', 'staying'].includes(status)) {
      list.push({ key: 'msg', label: t('stays.messageHost'), icon: MessageCircle, tone: 'secondary', onClick: () => navigate(`/chat/${b.property!.owner_id}?propertyId=${b.property_id}`) })
    }
    if (['pending', 'awaiting_payment', 'confirmed'].includes(status)) {
      list.push({ key: 'cancel', label: t('stays.cancel'), icon: X, tone: 'danger', onClick: () => cancel(b), busy: busy === b.id })
    }
    return list
  }

  const open = (b: StayBooking) => navigate(`${base}/property/${b.property_id}`)

  return (
    <ReservationsPage label={t('stays.my.title')}>
      <ReservationsHeader title={t('stays.my.title')} count={bookings?.length || 0} subtitle={t('stays.my.subtitle')} />
      {sent && (
        <p className="stay-success" role="status" style={{ marginTop: 12 }}>
          {t('stays.requestSent')} — {t('stays.requestSentBody')}{' '}
          <button type="button" className="rsv-back" style={{ display: 'inline' }} onClick={() => setParams({})} aria-label={t('common.close')}>
            ×
          </button>
        </p>
      )}
      {error && <p className="rsv-error" role="alert">{error}</p>}
      {info && <p className="stay-success" role="status" style={{ marginTop: 12 }}>{info}</p>}
      {bookings === null ? (
        <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
          <ListItemSkeleton />
          <ListItemSkeleton />
        </div>
      ) : bookings.length === 0 ? (
        <EmptyState icon={BedDouble} title={t('stays.my.empty')} body={t('stays.my.emptyBody')} action={{ label: t('stays.my.browse'), icon: Search, onClick: () => navigate(base || '/') }} />
      ) : (
        <>
          {upcoming.length > 0 && (
            <ReservationSectionView icon={CalendarDays} title={t('stays.my.upcoming')} meta={String(upcoming.length)}>
              {upcoming.map((b) => (
                <StayBookingCard key={b.id} booking={b} t={t} locale={locale} perspective="guest" actions={actionsFor(b)} onOpen={() => open(b)} highlight={b.id === focusId} />
              ))}
            </ReservationSectionView>
          )}
          {past.length > 0 && (
            <ReservationSectionView icon={History} title={t('stays.my.past')} meta={String(past.length)}>
              {past.map((b) => (
                <StayBookingCard key={b.id} booking={b} t={t} locale={locale} perspective="guest" onOpen={() => open(b)} highlight={b.id === focusId} />
              ))}
            </ReservationSectionView>
          )}
        </>
      )}
      {paying && (
        <DepositDialog
          booking={paying}
          defaultPhone={(user as { phone?: string | null } | null)?.phone}
          onClose={() => setPaying(null)}
          onSent={(message) => {
            setPaying(null)
            setInfo(message)
            load()
          }}
        />
      )}
    </ReservationsPage>
  )
}
