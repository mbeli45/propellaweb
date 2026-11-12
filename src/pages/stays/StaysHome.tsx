import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { BedDouble, Building2, ChevronRight, Compass, Home, Hotel, LayoutGrid, Map as MapIcon, TreePine } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/I18nContext'
import { useMarket } from '@/contexts/MarketContext'
import { useHomeProperties } from '@/hooks/useProperties'
import PropertyCard, { PropertyData } from '@/components/PropertyCard'
import PropertyFeedView from '@/components/PropertyFeedView'
import MarketSwitch from '@/components/MarketSwitch'
import { BrowseTab, BrowseTabs, FloatingActions, Rail, RailItem, SearchPill, useFeedSignal, useIsDesktop } from '@/components/browse/Browse'
import { PropertyCardSkeleton } from '@/components/skeletons'
import { DayStrip, Stepper, guestsLabel, nightsLabel, useStayBase } from '@/components/stays/StayUI'
import { resolveTown, townSearchTerms } from '@/utils/towns'
import { STAY_KINDS, StayBooking, StayKind, addDays, displayStatus, fetchMyStays, formatStayDay, formatStayRange, todayISO } from '@/lib/stays'
import '@/components/stays/Stays.css'
import '../user/Home.css'
import './StaysHome.css'

const UPCOMING = ['pending', 'awaiting_payment', 'confirmed', 'staying']

/**
 * Home → Stays: hotels, guest houses, furnished apartments and lodges by the
 * night. Its own list, rails, video feed and map, never mixed with rent & sale.
 */
export default function StaysHome({ mapPath }: { mapPath: string }) {
  const { user } = useAuth()
  const { t, currentLanguage } = useLanguage()
  const locale = currentLanguage === 'fr' ? 'fr-FR' : 'en-GB'
  const navigate = useNavigate()
  const isDesktop = useIsDesktop()
  const stayBase = useStayBase()
  const { featuredProperties, recentProperties, loading, error } = useHomeProperties('stays')

  const [query, setQuery] = useState('')
  const [town, setTown] = useState<string | null>(null)
  const [kind, setKind] = useState<StayKind | null>(null)
  const [checkIn, setCheckIn] = useState(todayISO())
  const [nights, setNights] = useState(1)
  const [guests, setGuests] = useState(1)
  const [panel, setPanel] = useState<'when' | 'who' | null>(null)
  const [feed, setFeed] = useState(false)
  const [nextStay, setNextStay] = useState<StayBooking | null>(null)

  // The guest's next booking, so Home answers "where am I staying?" first.
  useEffect(() => {
    if (!user?.id) { setNextStay(null); return }
    let active = true
    fetchMyStays(user.id)
      .then((list) => {
        if (!active) return
        const upcoming = list
          .filter((b) => UPCOMING.includes(displayStatus(b)) && b.check_out > todayISO())
          .sort((a, b) => a.check_in.localeCompare(b.check_in))
        setNextStay(upcoming[0] || null)
      })
      .catch(() => active && setNextStay(null))
    return () => { active = false }
  }, [user?.id])

  const stays = useMemo(() => {
    const seen = new Set<string>()
    return [...featuredProperties, ...recentProperties].filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)))
  }, [featuredProperties, recentProperties])

  // Typing a place or opening a town shows a grid; the kind tabs filter the rails.
  const searching = !!(query.trim() || town)
  const filtering = searching || !!kind
  const results = useMemo(() => {
    if (!filtering) return stays
    const words = query.trim() ? townSearchTerms(query.trim()).map((w) => w.toLowerCase()) : []
    return stays.filter((p) => {
      if (kind && p.stay_kind !== kind) return false
      if (town && resolveTown(p.town, p.location) !== town) return false
      if (!words.length) return true
      const hay = `${p.title} ${p.location} ${p.town || ''}`.toLowerCase()
      return words.some((w) => hay.includes(w))
    })
  }, [stays, filtering, query, town, kind])
  useFeedSignal(feed && results.length > 0)

  // Rails by town, busiest first: a traveller starts with "where am I going?"
  const rails = useMemo(() => {
    const byTown = new Map<string, PropertyData[]>()
    const other: PropertyData[] = []
    for (const p of stays) {
      if (kind && p.stay_kind !== kind) continue
      const name = resolveTown(p.town, p.location)
      if (!name) { other.push(p); continue }
      byTown.set(name, [...(byTown.get(name) || []), p])
    }
    const list: { town: string | null; items: PropertyData[] }[] = [...byTown.entries()]
      .sort((a, b) => b[1].length - a[1].length)
      .map(([name, items]) => ({ town: name, items }))
    if (other.length) list.push({ town: null, items: other })
    return list
  }, [stays, kind])

  const stayQuery = `?checkIn=${checkIn}&nights=${nights}&guests=${guests}`
  const openStay = useCallback(
    (p: PropertyData) => navigate(`/property/${p.id}${stayQuery}`),
    [navigate, stayQuery],
  )

  if (feed && results.length > 0) {
    return (
      <div className="browse-feed">
        <PropertyFeedView
          properties={results}
          loading={loading}
          header={isDesktop ? undefined : <MarketSwitch overlay />}
          onSwitchToGrid={() => setFeed(false)}
          onSearch={(q) => setQuery(q)}
          searchValue={query}
        />
      </div>
    )
  }

  const isTonight = checkIn === todayISO()
  const whenSummary = `${isTonight ? t('staysHome.tonight') : formatStayDay(checkIn, locale)} · ${nightsLabel(t, nights)}`
  const whenPhrase = isTonight ? t('staysHome.tonightLower') : t('staysHome.onDate', { date: formatStayDay(checkIn, locale) })
  const railTitle = (name: string | null, i: number) => {
    if (!name) return t('staysHome.townRail.more')
    const key = i === 0 ? 'available' : i % 2 ? 'popular' : 'explore'
    return t(`staysHome.townRail.${key}`, { town: name, when: whenPhrase })
  }
  const card = (p: PropertyData) => <PropertyCard key={p.id} property={p} onClick={() => openStay(p)} />
  const tabs: BrowseTab<StayKind>[] = [
    { key: null, label: t('staysHome.tabAll'), Icon: LayoutGrid },
    ...STAY_KINDS.map((k) => ({ key: k, label: t(`staysHome.rail.${k}`), Icon: KIND_ICONS[k] })),
  ]

  return (
    <div className="home-container browse-page stays-home">
      <div className="browse-top">
        <MarketSwitch tabs />
        <SearchPill
          whereLabel={t('staysHome.where')}
          value={town && !query ? town : query}
          onChange={(v) => { setQuery(v); setTown(null) }}
          onClear={() => { setQuery(''); setTown(null) }}
          onFocus={() => setPanel(null)}
          placeholder={t('staysHome.searchPlaceholder')}
          segments={[
            { key: 'when', label: t('staysHome.when'), value: whenSummary, open: panel === 'when', onClick: () => setPanel(panel === 'when' ? null : 'when') },
            { key: 'who', label: t('staysHome.who'), value: guestsLabel(t, guests), open: panel === 'who', onClick: () => setPanel(panel === 'who' ? null : 'who') },
          ]}
          onSubmit={() => setPanel(null)}
          submitLabel={t('staysHome.search')}
          clearLabel={t('common.clear', 'Clear')}
          moreLabel={t('browse.more')}
        />

        {panel && (
          <div className="stay-panel browse-panel">
            {panel === 'when' ? (
              <>
                <p className="stay-label">{t('stays.checkIn')}</p>
                <DayStrip start={todayISO()} days={30} value={checkIn} onChange={setCheckIn} locale={locale} label={t('stays.checkIn')} />
                <div className="stay-row">
                  <div>
                    <div className="stay-row-title">{nightsLabel(t, nights)}</div>
                    <div className="stay-row-sub">{t('stays.checkOut')}: {formatStayDay(addDays(checkIn, nights), locale)}</div>
                  </div>
                  <Stepper value={nights} min={1} max={30} onChange={setNights} label={t('staysHome.nights')} />
                </div>
              </>
            ) : (
              <div className="stay-row">
                <div className="stay-row-title">{t('stays.guests')}</div>
                <Stepper value={guests} min={1} max={20} onChange={setGuests} label={t('stays.guests')} />
              </div>
            )}
          </div>
        )}
        <BrowseTabs<StayKind> tabs={tabs} value={kind} onChange={setKind} label={t('staysHome.allKinds')} />
      </div>

      {nextStay && !filtering && (
        <button type="button" className="stays-home-next" onClick={() => navigate(`${stayBase}/stays/my`)}>
          <span className="stays-home-next-icon"><BedDouble size={20} /></span>
          <span className="stays-home-next-body">
            <span className="stays-home-next-label">{t('staysHome.nextStay')} · {t(`stays.status.${displayStatus(nextStay)}`)}</span>
            <strong>{nextStay.property?.title || t('stays.typeLabel')}</strong>
            <span>{formatStayRange(nextStay.check_in, nextStay.check_out, locale)}</span>
          </span>
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      )}

      {loading && stays.length === 0 ? (
        <PropertyCardSkeleton count={6} gridClassName="property-grid" />
      ) : error && stays.length === 0 ? (
        <Empty title={t('home.failedToLoadProperties')} text={error} />
      ) : stays.length === 0 ? (
        <Empty title={t('staysHome.emptyTitle')} text={t('staysHome.emptyText')}>
          {!user && (
            <button type="button" className="stays-home-link" onClick={() => navigate('/auth/signup?role=host')}>
              {t('staysHome.becomeHost')}
            </button>
          )}
        </Empty>
      ) : searching ? (
        <section className="properties-section">
          <div className="section-header">
            <h2 className="stays-home-h2">{town ? railTitle(town, 0) : t('staysHome.results', { count: results.length })}</h2>
          </div>
          {results.length === 0 ? (
            <Empty title={t('staysHome.noMatchTitle')} text={t('home.tryAdjustingSearch')} />
          ) : (
            <div className="property-grid">{results.map(card)}</div>
          )}
        </section>
      ) : rails.length === 0 ? (
        <Empty title={t('staysHome.noMatchTitle')} text={t('home.tryAdjustingSearch')} />
      ) : (
        rails.map((rail, i) => (
          <Rail
            key={rail.town || 'more'}
            title={railTitle(rail.town, i)}
            onOpen={rail.town ? () => { setTown(rail.town); setQuery(''); window.scrollTo({ top: 0 }) } : undefined}
            prevLabel={t('staysHome.prev')}
            nextLabel={t('staysHome.next')}
          >
            {rail.items.map((p) => <RailItem key={p.id}>{card(p)}</RailItem>)}
          </Rail>
        ))
      )}

      <FloatingActions
        actions={[
          ...(results.length > 0 ? [{ key: 'explore', label: t('browse.explore'), Icon: Compass, onClick: () => setFeed(true) }] : []),
          { key: 'map', label: t('browse.map'), Icon: MapIcon, onClick: () => navigate(mapPath) },
        ]}
      />
    </div>
  )
}

const KIND_ICONS: Record<StayKind, BrowseTab<StayKind>['Icon']> = {
  hotel: Hotel,
  guest_house: Home,
  apartment: Building2,
  lodge: TreePine,
}

function Empty({ title, text, children }: { title: string; text: string; children?: ReactNode }) {
  return (
    <div className="stays-home-empty">
      <p className="stays-home-empty-title">{title}</p>
      <p>{text}</p>
      {children}
    </div>
  )
}

/** One card at the foot of Properties pointing to the Stays side. */
export function StaysDoorway() {
  const { t } = useLanguage()
  const { setMarket } = useMarket()
  return (
    <button type="button" className="stays-doorway" onClick={() => { setMarket('stays'); window.scrollTo({ top: 0 }) }}>
      <BedDouble size={22} aria-hidden="true" />
      <span className="stays-doorway-body">
        <strong>{t('staysHome.doorwayTitle')}</strong>
        <span>{t('staysHome.doorwayText')}</span>
      </span>
      <ChevronRight size={20} aria-hidden="true" />
    </button>
  )
}
