import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { ArrowRight, ChevronLeft, ChevronRight, Search, SlidersHorizontal, X, type LucideIcon } from 'lucide-react'
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
}) {
  const [expanded, setExpanded] = useState(false)
  return (
    <form
      className={`browse-search${expanded ? ' is-expanded' : ''}`}
      role="search"
      onSubmit={(e) => { e.preventDefault(); onSubmit() }}
    >
      <label className="browse-search-seg browse-search-where">
        <span className="browse-search-label">{whereLabel}</span>
        <span className="browse-search-input">
          <Search size={16} aria-hidden="true" className="browse-search-icon" />
          <input type="search" value={value} onFocus={onFocus} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
          {value && onClear && (
            <button type="button" onClick={onClear} aria-label={clearLabel}>
              <X size={14} />
            </button>
          )}
        </span>
      </label>
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
  )
}

/**
 * Tells the bottom navigation whether Home is showing the video feed, so it
 * switches to its see-through style (it reads `homeViewMode`).
 */
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
        <button key={key} type="button" onClick={onClick}>
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
