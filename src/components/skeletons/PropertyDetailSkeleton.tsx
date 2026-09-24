import React from 'react'
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton'
import { SkeletonText } from './SkeletonText'
import './skeletons.css'

/** Placeholder for the property detail page: gallery, facts, description, agent. */
export const PropertyDetailSkeleton = React.memo(function PropertyDetailSkeleton() {
  return (
    <SkeletonGroup className="sk-detail">
      <div className="sk-detail-gallery">
        <Skeleton width="100%" height="100%" variant="rectangular" />
      </div>
      <div className="sk-detail-columns">
        <div className="sk-stack" style={{ gap: 24 }}>
          <div className="sk-stack" style={{ gap: 10 }}>
            <Skeleton width="35%" height={30} />
            <Skeleton width="80%" height={22} />
            <Skeleton width="50%" height={16} />
          </div>
          <div className="sk-row" style={{ gap: 24 }}>
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="sk-stack" style={{ gap: 8, alignItems: 'center' }}>
                <Skeleton width={40} height={40} variant="rounded" />
                <Skeleton width={60} height={13} />
              </div>
            ))}
          </div>
          <div className="sk-stack" style={{ gap: 12 }}>
            <Skeleton width={140} height={20} />
            <SkeletonText lines={4} lineHeight={15} />
          </div>
          <div className="sk-stack" style={{ gap: 12 }}>
            <Skeleton width={120} height={20} />
            <div className="sk-chips">
              {Array.from({ length: 6 }, (_, index) => (
                <Skeleton key={index} height={40} variant="rounded" />
              ))}
            </div>
          </div>
        </div>
        <div className="sk-surface sk-stack" style={{ padding: 20, gap: 16, alignSelf: 'start' }}>
          <div className="sk-row" style={{ gap: 12 }}>
            <Skeleton width={56} height={56} variant="circular" />
            <div className="sk-grow sk-stack" style={{ gap: 6 }}>
              <Skeleton width="60%" height={16} />
              <Skeleton width="40%" height={13} />
            </div>
          </div>
          <Skeleton height={48} variant="rounded" />
          <Skeleton height={48} variant="rounded" />
        </div>
      </div>
    </SkeletonGroup>
  )
})

export default PropertyDetailSkeleton
