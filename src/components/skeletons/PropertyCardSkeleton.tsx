import React from 'react'
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton'
import './skeletons.css'

interface PropertyCardSkeletonProps {
  count?: number
  /**
   * Grid class of the list this replaces (e.g. "property-grid",
   * "saved-properties-grid") so the placeholders use the real columns.
   * Defaults to a responsive auto-fill grid.
   */
  gridClassName?: string
  /** @deprecated kept for backwards compatibility; layout follows gridClassName. */
  variant?: 'grid' | 'list'
}

/** Placeholder for PropertyCard grids. Mirrors the card's image + body shape. */
export const PropertyCardSkeleton = React.memo<PropertyCardSkeletonProps>(function PropertyCardSkeleton({
  count = 6,
  gridClassName,
}) {
  return (
    <SkeletonGroup className={gridClassName || 'sk-property-grid'}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="sk-surface sk-property-card">
          <div className="sk-property-image">
            <Skeleton width="100%" height="100%" variant="rectangular" />
          </div>
          <div className="sk-property-body">
            <Skeleton width="40%" height={20} />
            <Skeleton width="75%" height={16} />
            <Skeleton width="55%" height={14} />
            <div className="sk-row" style={{ gap: 16, marginTop: 4 }}>
              <Skeleton width={48} height={14} />
              <Skeleton width={48} height={14} />
              <Skeleton width={48} height={14} />
            </div>
          </div>
        </div>
      ))}
    </SkeletonGroup>
  )
})

export default PropertyCardSkeleton
