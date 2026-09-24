import React from 'react'
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton'
import './skeletons.css'

interface FormSkeletonProps {
  fields?: number
  showSubmitButton?: boolean
}

/** Placeholder for forms that load existing data (edit property, verification). */
export const FormSkeleton = React.memo<FormSkeletonProps>(function FormSkeleton({
  fields = 4,
  showSubmitButton = true,
}) {
  return (
    <SkeletonGroup className="sk-form">
      {Array.from({ length: fields }, (_, index) => (
        <div key={index} className="sk-stack" style={{ gap: 8 }}>
          <Skeleton width={120} height={14} />
          <Skeleton height={46} variant="rounded" />
        </div>
      ))}
      {showSubmitButton && <Skeleton height={48} variant="rounded" style={{ marginTop: 8 }} />}
    </SkeletonGroup>
  )
})

export default FormSkeleton
