import React from 'react'
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton'
import { SkeletonText } from './SkeletonText'
import { PropertyCardSkeleton } from './PropertyCardSkeleton'
import './skeletons.css'

/** Placeholder for a public agent profile: profile card + listings grid. */
export const AgentProfileSkeleton = React.memo(function AgentProfileSkeleton() {
  return (
    <SkeletonGroup className="sk-detail">
      <div className="sk-surface sk-profile-card">
        <Skeleton width={96} height={96} variant="circular" />
        <Skeleton width={180} height={22} />
        <Skeleton width={110} height={14} />
        <SkeletonText lines={2} lineHeight={13} style={{ alignSelf: 'stretch', maxWidth: 520, marginInline: 'auto', width: '100%' }} />
        <div className="sk-row" style={{ gap: 16, marginTop: 6 }}>
          <Skeleton width={90} height={14} />
          <Skeleton width={110} height={14} />
        </div>
        <div className="sk-actions" style={{ alignSelf: 'stretch', maxWidth: 420, marginInline: 'auto', width: '100%', marginTop: 8 }}>
          <Skeleton height={44} variant="rounded" />
          <Skeleton height={44} variant="rounded" />
        </div>
      </div>
      <Skeleton width={160} height={20} />
      <PropertyCardSkeleton count={3} gridClassName="sk-property-grid" />
    </SkeletonGroup>
  )
})

export default AgentProfileSkeleton
