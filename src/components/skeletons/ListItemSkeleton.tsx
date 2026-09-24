import React from 'react'
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton'
import './skeletons.css'

interface ListItemSkeletonProps {
  count?: number
  /** Leading visual: avatar circle, thumbnail square, or nothing. */
  leading?: 'avatar' | 'thumbnail' | 'none'
  leadingSize?: number
  /** Number of text lines per row (1-3). */
  lines?: number
  /** Trailing element, e.g. an amount, time or action icon. */
  trailing?: 'text' | 'icon' | 'none'
  /** 'divided' rows sit flush with hairlines; 'card' rows are separate cards. */
  appearance?: 'divided' | 'card'
  /** Drop the row's own horizontal padding when the parent is already padded. */
  flush?: boolean
}

const LINE_WIDTHS = ['70%', '45%', '85%']

/**
 * Generic row placeholder for simple lists (messages, payments, reviews,
 * deals...). Prefer a dedicated skeleton for a distinctive layout.
 */
export const ListItemSkeleton = React.memo<ListItemSkeletonProps>(function ListItemSkeleton({
  count = 5,
  leading = 'none',
  leadingSize,
  lines = 2,
  trailing = 'none',
  appearance = 'divided',
  flush = false,
}) {
  const size = leadingSize ?? (leading === 'thumbnail' ? 56 : 44)
  const lineCount = Math.min(Math.max(lines, 1), 3)
  const classes = ['sk-list', `sk-list--${appearance === 'card' ? 'cards' : 'divided'}`, flush && 'sk-list--flush']
    .filter(Boolean)
    .join(' ')

  return (
    <SkeletonGroup className={classes}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="sk-list-row">
          {leading !== 'none' && (
            <Skeleton width={size} height={size} variant={leading === 'avatar' ? 'circular' : 'rounded'} />
          )}
          <div className="sk-grow sk-stack" style={{ gap: 8 }}>
            {Array.from({ length: lineCount }, (_, line) => (
              <Skeleton key={line} width={LINE_WIDTHS[line]} height={line === 0 ? 16 : 13} />
            ))}
          </div>
          {trailing === 'text' && <Skeleton width={72} height={16} />}
          {trailing === 'icon' && <Skeleton width={24} height={24} variant="rounded" />}
        </div>
      ))}
    </SkeletonGroup>
  )
})

export default ListItemSkeleton
