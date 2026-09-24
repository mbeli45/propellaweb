import React from 'react'
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton'
import './skeletons.css'

interface ReservationCardSkeletonProps {
  count?: number
}

/** Placeholder for the compact ReservationCard (thumbnail, status, meta, actions). */
export const ReservationCardSkeleton = React.memo<ReservationCardSkeletonProps>(function ReservationCardSkeleton({
  count = 3,
}) {
  return (
    <SkeletonGroup className="sk-reservations">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="sk-surface sk-reservation">
          <div className="sk-row" style={{ gap: 12, alignItems: 'flex-start' }}>
            <Skeleton width={84} height={84} variant="rounded" />
            <div className="sk-grow sk-stack" style={{ gap: 8 }}>
              <div className="sk-row" style={{ justifyContent: 'space-between' }}>
                <Skeleton width={84} height={20} borderRadius={999} />
                <Skeleton width={64} height={12} />
              </div>
              <Skeleton width="80%" height={16} />
              <Skeleton width="55%" height={13} />
              <Skeleton width="65%" height={13} />
            </div>
          </div>
          <div className="sk-actions">
            <Skeleton height={42} variant="rounded" />
            <Skeleton height={42} variant="rounded" />
          </div>
        </div>
      ))}
    </SkeletonGroup>
  )
})

export default ReservationCardSkeleton
