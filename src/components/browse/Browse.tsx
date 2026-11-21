import { useCallback, useEffect, useRef, useState, type ReactNode, useSyncExternalStore } from 'react'
import { ArrowRight, ChevronLeft, ChevronRight, Clapperboard, Compass, MapPin, Search, SlidersHorizontal, X, type LucideIcon } from 'lucide-react'
import './Browse.css'

/**
 * Shared pieces of the Home browse layout, used by both Properties and Stays:
 * one search pill, a slim row of icon tabs, sideways rails, and a floating
 * Explore · Map pill so the header stays quiet.
 */

export interface BrowseTab<K extends string> {
  key: K | null
  label: string
  Icon: LucideIcon
}

export function BrowseTabs<K extends string>({
  tabs,
  value,
  onChange,
  label,
}: {
  tabs: BrowseTab<K>[]
  value: K | null
  onChange: (key: K | null) => void
  label: string
}) {
  return (
    <div className="browse-tabs hidden-scrollbar" role="tablist" aria-label={label}>
      {tabs.map(({ key, label: text, Icon }) => (
        <button
          key={key || 'all'}
          type="button"
          role="tab"
          aria-selected={value === key}
          className={`browse-tab${value === key ? ' is-active' : ''}`}
          onClick={() => onChange(key)}
        >
          <Icon size={20} aria-hidden="true" />
          <span>{text}</span>
        </button>
      ))}
    </div>
  )
}

export interface SearchSegment {
  key: string
  label: string
  value: string
  open?: boolean
  onClick: () => void
}

export function SearchPill({
  whereLabel,
  value,
  onChange,
  onClear,
  onFocus,
  placeholder,
  segments,
  onSubmit,
  submitLabel,
  clearLabel,
  moreLabel,
  picks,
  picksLabel,
  onExplore,
  exploreLabel,
}: {
  whereLabel: string
  value: string
  onChange: (v: string) => void
  onClear?: () => void
  onFocus?: () => void
  placeholder: string
  segments: SearchSegment[]
  onSubmit: () => void
  submitLabel: string
  clearLabel: string
  /** Phones show only "Where" until this toggle opens the other fields. */
  moreLabel: string
  /** Towns offered as one-tap picks while the field is focused and empty. */
  picks?: { label: string; active?: boolean; onPick: () => void }[]
  picksLabel?: string
  /** Small screens: a compass in the pill that opens the Explore page. */
  onExplore?: () => void
  exploreLabel?: string
}) {
  const [expanded, setExpanded] = useState(false)
  const [focused, setFocused] = useState(false)
  const blurTimer = useRef<number>()
  const showPicks = !!picks?.length && focused && !value
  return (
    <>
    <form
      className={`browse-search${expanded ? ' is-expanded' : ''}`}
      role="search"
      onSubmit={(e) => { e.preventDefault(); onSubmit() }}
    >
      <label className="browse-search-seg browse-search-where">
        <span className="browse-search-label">{whereLabel}</span>
        <span className="browse-search-input">
          <Search size={16} aria-hidden="true" className="browse-search-icon" />
          <input
            type="search"
            value={value}
            onFocus={() => { window.clearTimeout(blurTimer.current); setFocused(true); onFocus?.() }}
            // Wait a moment so a tap on a pick lands before the picks hide.
            onBlur={() => { blurTimer.current = window.setTimeout(() => setFocused(false), 150) }}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
          />
          {value && onClear && (
            <button type="button" onClick={onClear} aria-label={clearLabel}>
              <X size={14} />
            </button>
          )}
        </span>
      </label>
      {onExplore && (
        <button type="button" className="browse-search-explore" onClick={onExplore} aria-label={exploreLabel} title={exploreLabel}>
          <Compass size={18} />
        </button>
      )}
      <button
        type="button"
        className="browse-search-more"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-label={moreLabel}
        title={moreLabel}
      >
        <SlidersHorizontal size={18} />
      </button>
      {segments.map((s) => (
        <button
          key={s.key}
          type="button"
          className={`browse-search-seg browse-search-extra${s.open ? ' is-open' : ''}`}
          onClick={s.onClick}
          aria-expanded={s.open}
        >
          <span className="browse-search-label">{s.label}</span>
          <span className="browse-search-value">{s.value}</span>
        </button>
      ))}
      <button type="submit" className="browse-search-go" aria-label={submitLabel}>
        <Search size={20} />
      </button>
    </form>
    {showPicks && (
      <div className="browse-picks hidden-scrollbar" role="group" aria-label={picksLabel}>
        {picks!.map((p) => (
          <button
            key={p.label}
            type="button"
            className={`browse-pick${p.active ? ' is-active' : ''}`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => { p.onPick(); setFocused(false) }}
          >
            <MapPin size={14} aria-hidden="true" />
            {p.label}
          </button>
        ))}
      </div>
    )}
    </>
  )
}

/**
 * Top row of Home on phones and tablets: Properties | Stays, and a button to
 * the video feed (the feed's own top row has the grid button back).
 */
export function BrowseHead({ children, onFeed, feedLabel }: { children: ReactNode; onFeed?: () => void; feedLabel: string }) {
  return (
    <div className="browse-head">
      <div className="browse-head-main">{children}</div>
      {onFeed && (
        <button type="button" className="browse-head-feed" onClick={onFeed} aria-label={feedLabel} title={feedLabel}>
          <Clapperboard size={22} aria-hidden="true" />
        </button>
      )}
    </div>
  )
}

/**
 * Tells the bottom navigation whether Home is showing the video feed, so it
 * switches to its see-through style (it reads `homeViewMode`).
 */
type HomeView = 'feed' | 'grid'
let homeView: HomeView | null = null
const homeViewListeners = new Set<() => void>()
const subscribeHomeView = (l: () => void) => {
  homeViewListeners.add(l)
  return () => { homeViewListeners.delete(l) }
}

/**
 * Feed or grid on Home, shared by Properties and Stays so switching between
 * them keeps the view. `initial` only applies before anything has been chosen.
 */
export function useHomeView(initial: HomeView) {
  if (homeView === null) homeView = initial
  const view = useSyncExternalStore(subscribeHomeView, () => homeView as HomeView, () => homeView as HomeView)
  const setView = useCallback((v: HomeView) => {
    homeView = v
    homeViewListeners.forEach((l) => l())
  }, [])
  return [view, setView] as const
}

export function useFeedSignal(feed: boolean) {
  useEffect(() => {
    try { localStorage.setItem('homeViewMode', feed ? 'feed' : 'grid') } catch { /* per-viewer only */ }
    window.dispatchEvent(new Event('viewModeChange'))
  }, [feed])
  useEffect(() => () => {
    try { localStorage.setItem('homeViewMode', 'grid') } catch { /* per-viewer only */ }
    window.dispatchEvent(new Event('viewModeChange'))
  }, [])
}

/** True at the desktop breakpoint, where the header carries Properties | Stays. */
export function useIsDesktop() {
  const query = '(min-width: 1024px)'
  const [desktop, setDesktop] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const on = () => setDesktop(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return desktop
}

/** Floating pill at the foot of Home: video feed and map, out of the header. */
export function FloatingActions({ actions }: { actions: { key: string; label: string; Icon: LucideIcon; onClick: () => void }[] }) {
  if (!actions.length) return null
  return (
    <div className="browse-float" role="group">
      {actions.map(({ key, label, Icon, onClick }) => (
        <button key={key} type="button" onClick={onClick} data-action={key}>
          <Icon size={18} aria-hidden="true" />
          <span>{label}</span>
        </button>
      ))}
    </div>
  )
}

/** A titled row of cards that scrolls sideways, with arrows on wide screens. */
export function Rail({
  title,
  onOpen,
  prevLabel,
  nextLabel,
  children,
}: {
  title: string
  onOpen?: () => void
  prevLabel: string
  nextLabel: string
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [edge, setEdge] = useState({ start: true, end: false })
  const measure = useCallback(() => {
    const el = ref.current
    if (!el) return
    setEdge({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 })
  }, [])
  useEffect(() => {
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [measure, children])
  const step = (dir: 1 | -1) => {
    const el = ref.current
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: 'smooth' })
  }

  return (
    <section className="properties-section browse-rail">
      <div className="section-header">
        {onOpen ? (
          <button type="button" className="browse-rail-title" onClick={onOpen}>
            <h2>{title}</h2>
            <span className="browse-rail-go" aria-hidden="true"><ArrowRight size={16} /></span>
          </button>
        ) : (
          <h2 className="browse-rail-heading">{title}</h2>
        )}
        <div className="browse-rail-arrows">
          <button type="button" onClick={() => step(-1)} disabled={edge.start} aria-label={prevLabel}><ChevronLeft size={16} /></button>
          <button type="button" onClick={() => step(1)} disabled={edge.end} aria-label={nextLabel}><ChevronRight size={16} /></button>
        </div>
      </div>
      <div ref={ref} className="browse-rail-track hidden-scrollbar" onScroll={measure}>
        {children}
      </div>
    </section>
  )
}

/** Wrap each card in a rail with this so widths stay even. */
export function RailItem({ children }: { children: ReactNode }) {
  return <div className="browse-rail-item">{children}</div>
}
