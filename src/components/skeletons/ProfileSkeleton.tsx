import React from 'react'
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton'
import './skeletons.css'

/** Placeholder for the signed-in user's profile/menu page. */
export const ProfileSkeleton = React.memo(function ProfileSkeleton() {
  return (
    <SkeletonGroup className="sk-detail" style={{ maxWidth: 720 }}>
      <div className="sk-surface sk-profile-card">
        <Skeleton width={96} height={96} variant="circular" />
        <Skeleton width={160} height={20} />
        <Skeleton width={200} height={14} />
      </div>
      <div className="sk-surface" style={{ padding: '4px 16px' }}>
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="sk-row" style={{ gap: 12, padding: '14px 0' }}>
            <Skeleton width={24} height={24} variant="rounded" />
            <Skeleton width="45%" height={16} />
            <span className="sk-grow" />
            <Skeleton width={16} height={16} variant="rounded" />
          </div>
        ))}
      </div>
    </SkeletonGroup>
  )
})

export default ProfileSkeleton
