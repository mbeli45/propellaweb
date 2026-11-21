import { formatFcfa } from '@/components/stays/StayUI'
import { fromISODate } from '@/lib/stays'

type TFunction = (key: string, options?: any) => string

/** 1 250 000 → "1.3M", 85 000 → "85k": fits above a narrow bar. */
const shortAmount = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M` : n >= 1000 ? `${Math.round(n / 1000)}k` : String(Math.round(n))

/**
 * The host's two charts: rooms booked each of the next 14 nights, and the
 * value of confirmed bookings by month. Plain bars, no chart library.
 */
export default function HostCharts({
  occupancy,
  totalRooms,
  revenue,
  t,
  locale,
}: {
  occupancy: { night: string; booked: number }[]
  totalRooms: number
  revenue: { month: string; total: number }[]
  t: TFunction
  locale: string
}) {
  const nights = occupancy.length * Math.max(totalRooms, 1)
  const booked = occupancy.reduce((sum, n) => sum + Math.min(n.booked, totalRooms), 0)
  const pct = totalRooms ? Math.round((booked / nights) * 100) : 0
  const maxRevenue = Math.max(...revenue.map((m) => m.total), 1)
  const thisMonth = revenue[revenue.length - 1]?.total || 0
  const monthLabel = (m: string) => fromISODate(`${m}-01`).toLocaleDateString(locale, { month: 'short' })

  return (
    <section className="host-charts" aria-label={t('stays.hub.chartsLabel')}>
      <div className="host-chart">
        <span className="host-chart-title">{t('stays.hub.chartOccupancy')}</span>
        <span className="host-chart-value">{pct}%</span>
        <span className="host-chart-sub">{t('stays.hub.chartOccupancySub', { pct })}</span>
        <ol className="host-bars host-bars--nights">
          {occupancy.map((n, i) => {
            const share = totalRooms ? Math.min(n.booked / totalRooms, 1) : 0
            const date = fromISODate(n.night)
            const day = date.toLocaleDateString(locale, { weekday: 'short', day: 'numeric' })
            return (
              <li key={n.night} className={i === 0 ? 'is-today' : undefined} title={t('stays.hub.nightBar', { day, booked: n.booked, total: totalRooms })}>
                <span className="host-bar-track">
                  <span className="host-bar-fill" style={{ height: `${Math.max(share * 100, share ? 6 : 0)}%` }} />
                </span>
                <span className="host-bar-label" aria-hidden="true">{date.toLocaleDateString(locale, { weekday: 'narrow' })}</span>
                <span className="host-sr">{t('stays.hub.nightBar', { day, booked: n.booked, total: totalRooms })}</span>
              </li>
            )
          })}
        </ol>
      </div>

      <div className="host-chart">
        <span className="host-chart-title">{t('stays.hub.chartRevenue')}</span>
        <span className="host-chart-value">{formatFcfa(thisMonth)}</span>
        <span className="host-chart-sub">{t('stays.hub.chartRevenueSub')}</span>
        <ol className="host-bars host-bars--months">
          {revenue.map((m, i) => (
            <li key={m.month} className={i === revenue.length - 1 ? 'is-today' : undefined} title={t('stays.hub.monthBar', { month: monthLabel(m.month), amount: formatFcfa(m.total) })}>
              <span className="host-bar-col">
                <span className="host-bar-amount" aria-hidden="true">{m.total ? shortAmount(m.total) : ''}</span>
                <span
                  className={`host-bar-money${m.total ? '' : ' is-empty'}`}
                  style={{ height: m.total ? `${Math.max((m.total / maxRevenue) * 100, 5)}%` : 2 }}
                />
              </span>
              <span className="host-bar-label" aria-hidden="true">{monthLabel(m.month)}</span>
              <span className="host-sr">{t('stays.hub.monthBar', { month: monthLabel(m.month), amount: formatFcfa(m.total) })}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
