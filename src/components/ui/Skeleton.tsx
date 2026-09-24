import React, { CSSProperties } from 'react'
import { useLanguage } from '@/contexts/I18nContext'
import './Skeleton.css'

export interface SkeletonProps {
  width?: number | string
  height?: number | string
  borderRadius?: number
  style?: CSSProperties
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded'
  /** 'wave' is kept for backwards compatibility and behaves like 'pulse'. */
  animation?: 'pulse' | 'wave' | 'none'
  className?: string
}

const px = (value: number | string | undefined) => (typeof value === 'number' ? `${value}px` : value)

// A shared negative delay keeps late-mounted blocks on the same pulse phase as
// the ones already on screen.
const syncDelay = () =>
  typeof performance !== 'undefined' ? -Math.round(performance.now() % 1600) : 0

/**
 * Base building block for loading placeholders. Compose these into
 * screen-specific skeletons (see components/skeletons) rather than showing
 * "Loading..." text or spinners for content that is loading.
 *
 * @example
 * <Skeleton width={200} height={16} />
 * <Skeleton width={48} height={48} variant="circular" />
 */
export const Skeleton = React.memo<SkeletonProps>(function Skeleton({
  width = '100%',
  height = 16,
  borderRadius,
  style,
  variant = 'text',
  animation = 'pulse',
  className = '',
}) {
  const classes = [
    'skeleton',
    variant !== 'text' && `skeleton--${variant}`,
    animation === 'none' && 'skeleton--static',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <span
      aria-hidden="true"
      className={classes}
      style={{
        width: px(width),
        height: px(height),
        ...(borderRadius !== undefined ? { borderRadius } : null),
        ...({ '--skeleton-sync': syncDelay() } as CSSProperties),
        ...style,
      }}
    />
  )
})

interface SkeletonGroupProps {
  children: React.ReactNode
  className?: string
  style?: CSSProperties
  /** Screen-reader label; defaults to the localized "Loading..." string. */
  label?: string
}

/**
 * Wraps a set of skeleton blocks so assistive tech announces one "Loading"
 * state instead of a pile of empty elements. Every composed skeleton renders
 * inside one of these.
 */
export function SkeletonGroup({ children, className = '', style, label }: SkeletonGroupProps) {
  const { t } = useLanguage()
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label={label ?? t('common.loading')}
      className={`skeleton-group ${className}`.trim()}
      style={style}
    >
      {children}
    </div>
  )
}

export default Skeleton
