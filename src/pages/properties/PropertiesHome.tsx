import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Compass, Key, LayoutGrid, Map as MapIcon, Star, Tag, User as UserIcon } from 'lucide-react'
import { useLanguage } from '@/contexts/I18nContext'
import { useHomeProperties } from '@/hooks/useProperties'
import { useSearch } from '@/hooks/useSearch'
import { useAgentVerification } from '@/hooks/useAgentVerification'
import FilterModal, { FilterOptions, MAX_PRICE } from '@/components/FilterModal'
import PropertyCard, { PropertyData } from '@/components/PropertyCard'
import PropertyFeedView from '@/components/PropertyFeedView'
import MarketSwitch from '@/components/MarketSwitch'
import { BrowseHead, BrowseTab, BrowseTabs, FloatingActions, Rail, RailItem, SearchPill, useFeedSignal, useHomeView, useIsDesktop } from '@/components/browse/Browse'
import { PropertyCardSkeleton } from '@/components/skeletons'
import { StaysDoorway } from '@/pages/stays/StaysHome'
import { POPULAR_TOWNS, resolveTown } from '@/utils/towns'
import '../user/Home.css'
import '../HomeBrowse.css'
import './PropertiesHome.css'

type Deal = 'rent' | 'sale'

const DEFAULT_FILTERS: FilterOptions = {
  propertyType: [],
  priceRange: [0, MAX_PRICE],
  bedrooms: null,
  bathrooms: null,
  category: [],
}

/**
 * Home → Properties (rent & sale), shared by guests and signed-in users.
 * Tabs for rent or sale, one Where · Budget · Size search, then rails by town.
 */
export default function PropertiesHome({ basePath, showAgents = false }: { basePath: '/user' | '/guest'; showAgents?: boolean }) {
  const { t, currentLanguage } = useLanguage()
  const navigate = useNavigate()
  const isDesktop = useIsDesktop()
  const { getTopVerifiedAgents } = useAgentVerification()
  const { featuredProperties, recentProperties, loading: homeLoading, error: homeError } = useHomeProperties()
  const {
    searchTerm,
    results: searchResults,
    totalCount: searchTotalCount,
    hasMore,
    loading: searchLoading,
    error: searchError,
    search,
    clearSearch,
    loadMore,
    updateFilters,
  } = useSearch()

  const [where, setWhere] = useState('')
  const [deal, setDeal] = useState<Deal | null>(null)
  const [filters, setFilters] = useState<FilterOptions>(DEFAULT_FILTERS)
  const [filterVisible, setFilterVisible] = useState(false)
  const [viewMode, setViewMode] = useHomeView('feed')
  const [topAgents, setTopAgents] = useState<any[]>([])

  useEffect(() => {
    if (!showAgents) return
    let active = true
    getTopVerifiedAgents(8).then((a) => active && setTopAgents(a)).catch(() => active && setTopAgents([]))
    return () => { active = false }
    // Fetch once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAgents])

  // Search as you type, after a short pause.
  useEffect(() => {
    const q = where.trim()
    if (q === searchTerm) return
    const id = window.setTimeout(() => (q ? search(q) : clearSearch()), 400)
    return () => window.clearTimeout(id)
  }, [where, searchTerm, search, clearSearch])

  const submit = useCallback(() => {
    const q = where.trim()
    if (q) search(q)
    else clearSearch()
  }, [where, search, clearSearch])

  const openTown = useCallback((town: string) => {
    setWhere(town)
    search(town)
    window.scrollTo({ top: 0 })
  }, [search])

  const applyFilters = useCallback((next: FilterOptions) => {
    setFilters(next)
    updateFilters({
      category: next.category,
      propertyType: next.propertyType,
      minPrice: next.priceRange[0] > 0 ? next.priceRange[0] : undefined,
      // The top of the range means "no maximum", so don't constrain the query.
      maxPrice: next.priceRange[1] < MAX_PRICE ? next.priceRange[1] : undefined,
      bedrooms: next.bedrooms || undefined,
      bathrooms: next.bathrooms || undefined,
    })
    setFilterVisible(false)
  }, [updateFilters])

  const changeView = setViewMode

  useFeedSignal(viewMode === 'feed')

  const byDeal = useCallback((list: PropertyData[]) => (deal ? list.filter((p) => p.type === deal) : list), [deal])

  const all = useMemo(() => {
    const seen = new Set<string>()
    return [...featuredProperties, ...recentProperties].filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)))
  }, [featuredProperties, recentProperties])

  const searching = !!searchTerm
  const results = useMemo(() => byDeal(searchResults), [byDeal, searchResults])
  const featured = useMemo(() => byDeal(featuredProperties), [byDeal, featuredProperties])

  // Rails by town, busiest first.
  const townRails = useMemo(() => {
    const byTown = new Map<string, PropertyData[]>()
    const other: PropertyData[] = []
    for (const p of byDeal(all)) {
      const name = resolveTown(p.town, p.location)
      if (!name) { other.push(p); continue }
      byTown.set(name, [...(byTown.get(name) || []), p])
    }
    const list: { town: string | null; items: PropertyData[] }[] = [...byTown.entries()]
      .sort((a, b) => b[1].length - a[1].length)
      .map(([name, items]) => ({ town: name, items }))
    if (other.length) list.push({ town: null, items: other })
    return list
  }, [all, byDeal])

  if (viewMode === 'feed') {
    return (
      <div className="browse-feed">
        <PropertyFeedView
          properties={searching ? results : byDeal(all)}
          loading={searching ? searchLoading : homeLoading}
          onSwitchToGrid={() => changeView('grid')}
          header={isDesktop ? undefined : <MarketSwitch overlay />}
          onOpenSearch={() => { changeView('grid'); window.setTimeout(() => document.querySelector<HTMLInputElement>('.browse-search input')?.focus(), 60) }}
        />
      </div>
    )
  }

  const money = (n: number) => new Intl.NumberFormat(currentLanguage === 'fr' ? 'fr-FR' : 'en-GB', { notation: 'compact', maximumFractionDigits: 1 }).format(n) + ' FCFA'
  const [minPrice, maxPrice] = filters.priceRange
  const budget = minPrice > 0 && maxPrice < MAX_PRICE
    ? `${money(minPrice)} – ${money(maxPrice)}`
    : maxPrice < MAX_PRICE
      ? t('browse.upTo', { max: money(maxPrice) })
      : minPrice > 0
        ? t('browse.from', { min: money(minPrice) })
        : t('browse.anyBudget')
  const size = filters.bedrooms ? t('browse.bedsMin', { count: filters.bedrooms }) : t('browse.anySize')

  const townTitle = (town: string | null, i: number) => {
    if (!town) return t('browse.moreHomes')
    const key = i % 3 === 0 ? 'homesIn' : i % 3 === 1 ? 'popularIn' : 'exploreIn'
    return t(`browse.${key}`, { town })
  }

  const tabs: BrowseTab<Deal>[] = [
    { key: null, label: t('browse.all'), Icon: LayoutGrid },
    { key: 'rent', label: t('browse.forRent'), Icon: Key },
    { key: 'sale', label: t('browse.forSale'), Icon: Tag },
  ]

  const loading = searching ? searchLoading : homeLoading
  const error = searching ? searchError : homeError
  const nothing = !loading && !error && (searching ? results.length === 0 : all.length === 0)
  const requestPath = basePath === '/user' ? '/user/deals' : '/guest/auth'

  return (
    <div className="home-container browse-page properties-home">
      <div className="browse-top">
        <BrowseHead onFeed={all.length > 0 ? () => changeView('feed') : undefined} feedLabel={t('feedView.videoFeed')}>
          <MarketSwitch tabs />
        </BrowseHead>
        <SearchPill
          picks={POPULAR_TOWNS.map((town) => ({ label: town, onPick: () => openTown(town) }))}
          picksLabel={t('browse.where')}
          onExplore={() => navigate(`${basePath}/explore`)}
          exploreLabel={t('browse.explore')}
          whereLabel={t('browse.where')}
          value={where}
          onChange={setWhere}
          onClear={() => { setWhere(''); clearSearch() }}
          placeholder={t('browse.placeholder')}
          segments={[
            { key: 'budget', label: t('browse.budget'), value: budget, onClick: () => setFilterVisible(true) },
            { key: 'size', label: t('browse.size'), value: size, onClick: () => setFilterVisible(true) },
          ]}
          onSubmit={submit}
          submitLabel={t('browse.search')}
          clearLabel={t('common.clear', 'Clear')}
          moreLabel={t('browse.more')}
        />
        <BrowseTabs<Deal> tabs={tabs} value={deal} onChange={setDeal} label={t('browse.all')} />
      </div>

      {error && <p className="properties-home-error">{t('home.failedToLoadProperties')}</p>}

      {loading && (searching ? results.length === 0 : all.length === 0) ? (
        <PropertyCardSkeleton count={6} gridClassName="property-grid" />
      ) : nothing ? (
        <div className="properties-home-empty">
          <p>{searching ? t('home.tryAdjustingSearch') : t('home.noPropertiesAvailable')}</p>
          <p>{t('browse.requestText')}</p>
          <button type="button" onClick={() => navigate(requestPath)}>{t('deals.requestProperty')}</button>
        </div>
      ) : searching ? (
        <section className="properties-section">
          <div className="section-header">
            <h2>{t('home.searchResults', { count: deal ? results.length : searchTotalCount || results.length })}</h2>
          </div>
          <div className="property-grid">
            {results.map((p) => <PropertyCard key={p.id} property={p} />)}
          </div>
          {/* Search returns 20 rows a page. */}
          {hasMore && (
            <div className="properties-home-more">
              <button type="button" onClick={loadMore} disabled={searchLoading}>
                {searchLoading ? t('common.loading') : t('search.loadMore', 'Load more')}
              </button>
            </div>
          )}
        </section>
      ) : (
        <>
          {featured.length > 0 && (
            <Rail title={t('browse.featured')} onOpen={() => navigate(`${basePath}/explore?filter=featured`)} prevLabel={t('browse.prev')} nextLabel={t('browse.next')}>
              {featured.map((p) => <RailItem key={p.id}><PropertyCard property={p} /></RailItem>)}
            </Rail>
          )}

          {townRails.map((rail, i) => (
            <Rail
              key={rail.town || 'more'}
              title={townTitle(rail.town, i)}
              onOpen={rail.town ? () => openTown(rail.town as string) : undefined}
              prevLabel={t('browse.prev')}
              nextLabel={t('browse.next')}
            >
              {rail.items.map((p) => <RailItem key={p.id}><PropertyCard property={p} /></RailItem>)}
            </Rail>
          ))}

          {showAgents && topAgents.length > 0 && (
            <Rail title={t('browse.topAgents')} onOpen={() => navigate(`${basePath}/explore?filter=agents`)} prevLabel={t('browse.prev')} nextLabel={t('browse.next')}>
              {topAgents.map((agent) => {
                const rating = agent.verification?.average_rating || 0
                return (
                  <button key={agent.id} type="button" className="properties-home-agent" onClick={() => navigate(`/agents/${agent.id}`)}>
                    {agent.avatar_url ? <img src={agent.avatar_url} alt="" /> : <span className="properties-home-agent-avatar"><UserIcon size={24} /></span>}
                    <strong>{agent.full_name}</strong>
                    <span><Star size={12} aria-hidden="true" /> {rating ? rating.toFixed(1) : '–'}</span>
                  </button>
                )
              })}
            </Rail>
          )}

          <StaysDoorway />
        </>
      )}

      <FloatingActions
        actions={[
          { key: 'explore', label: t('browse.explore'), Icon: Compass, onClick: () => changeView('feed') },
          { key: 'map', label: t('browse.map'), Icon: MapIcon, onClick: () => navigate(`${basePath}/map`) },
        ]}
      />

      <FilterModal visible={filterVisible} onClose={() => setFilterVisible(false)} onApply={applyFilters} initialFilters={filters} />
    </div>
  )
}
