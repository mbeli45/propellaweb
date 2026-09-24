import React, { CSSProperties } from 'react'
import { Skeleton } from '@/components/ui/Skeleton'

interface SkeletonTextProps {
  lines?: number
  lineHeight?: number
  gap?: number
  /** Width of the final line, so paragraphs don't look like solid blocks. */
  lastLineWidth?: string | number
  style?: CSSProperties
}

/** A paragraph of placeholder text lines. */
export const SkeletonText = React.memo<SkeletonTextProps>(function SkeletonText({
  lines = 3,
  lineHeight = 14,
  gap = 8,
  lastLineWidth = '60%',
  style,
}) {
  return (
    <div className="sk-stack" style={{ gap, ...style }}>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton
          key={index}
          height={lineHeight}
          width={index === lines - 1 && lines > 1 ? lastLineWidth : '100%'}
        />
      ))}
    </div>
  )
})

export default SkeletonText
