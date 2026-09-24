import React from 'react'
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton'
import './skeletons.css'

interface DashboardSkeletonProps {
  /** Page title + subtitle block (for pages that render their own header). */
  showHeader?: boolean
  /** Large summary card, e.g. the wallet balance. */
  showHeroCard?: boolean
  /** Number of stat tiles (0 to hide). */
  statCount?: number
  /** Number of rows in the trailing list section (0 to hide). */
  listCount?: number
}

/** Placeholder for stats/analytics pages: header, hero card, stat tiles, list. */
export const DashboardSkeleton = React.memo<DashboardSkeletonProps>(function DashboardSkeleton({
  showHeader = false,
  showHeroCard = false,
  statCount = 4,
  listCount = 3,
}) {
  return (
    <SkeletonGroup className="sk-dashboard">
      {showHeader && (
        <div className="sk-stack" style={{ gap: 8 }}>
          <Skeleton width="40%" height={28} />
          <Skeleton width="60%" height={14} />
        </div>
      )}

      {showHeroCard && (
        <div className="sk-surface sk-hero">
          <Skeleton width="30%" height={14} />
          <Skeleton width="50%" height={36} />
          <div className="sk-actions" style={{ marginTop: 8, maxWidth: 420 }}>
            <Skeleton height={44} variant="rounded" />
            <Skeleton height={44} variant="rounded" />
          </div>
        </div>
      )}

      {statCount > 0 && (
        <div className="sk-stats">
          {Array.from({ length: statCount }, (_, index) => (
            <div key={index} className="sk-surface sk-stat">
              <Skeleton width={36} height={36} variant="rounded" />
              <Skeleton width="55%" height={22} />
              <Skeleton width="75%" height={12} />
            </div>
          ))}
        </div>
      )}

      {listCount > 0 && (
        <div className="sk-stack" style={{ gap: 12 }}>
          <Skeleton width={160} height={18} />
          <div className="sk-surface" style={{ padding: '0 16px' }}>
            {Array.from({ length: listCount }, (_, index) => (
              <div
                key={index}
                className="sk-row"
                style={{
                  gap: 12,
                  padding: '14px 0',
                  borderBottom: index === listCount - 1 ? 'none' : '1px solid rgba(128,145,166,.2)',
                }}
              >
                <Skeleton width={40} height={40} variant="circular" />
                <div className="sk-grow sk-stack" style={{ gap: 8 }}>
                  <Skeleton width="60%" height={14} />
                  <Skeleton width="35%" height={12} />
                </div>
                <Skeleton width={80} height={16} />
              </div>
            ))}
          </div>
        </div>
      )}
    </SkeletonGroup>
  )
})

export default DashboardSkeleton
