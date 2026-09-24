import React from 'react'
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton'
import './skeletons.css'

/** Full-bleed placeholder for a map while it and its markers load. */
export const MapSkeleton = React.memo(function MapSkeleton() {
  return (
    <SkeletonGroup className="sk-map">
      <Skeleton width="100%" height="100%" variant="rectangular" />
    </SkeletonGroup>
  )
})

export default MapSkeleton
