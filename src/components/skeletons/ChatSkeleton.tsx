import React from 'react'
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton'
import './skeletons.css'

const BUBBLES: { mine: boolean; width: string; height: number }[] = [
  { mine: false, width: '52%', height: 44 },
  { mine: true, width: '38%', height: 36 },
  { mine: false, width: '60%', height: 64 },
  { mine: true, width: '45%', height: 44 },
  { mine: false, width: '32%', height: 36 },
  { mine: true, width: '55%', height: 56 },
]

/** Placeholder for a chat conversation: header, message bubbles, composer. */
export const ChatSkeleton = React.memo(function ChatSkeleton() {
  return (
    <SkeletonGroup className="sk-chat">
      <div className="sk-chat-header">
        <Skeleton width={24} height={24} variant="rounded" />
        <Skeleton width={40} height={40} variant="circular" />
        <div className="sk-grow sk-stack" style={{ gap: 6 }}>
          <Skeleton width="35%" height={16} />
          <Skeleton width="20%" height={12} />
        </div>
      </div>
      <div className="sk-chat-body">
        {BUBBLES.map((bubble, index) => (
          <Skeleton
            key={index}
            width={bubble.width}
            height={bubble.height}
            borderRadius={18}
            className={bubble.mine ? 'sk-bubble--mine' : 'sk-bubble--theirs'}
          />
        ))}
      </div>
      <div className="sk-chat-composer">
        <Skeleton width={32} height={32} variant="circular" />
        <div className="sk-grow">
          <Skeleton height={44} borderRadius={22} />
        </div>
        <Skeleton width={44} height={44} variant="circular" />
      </div>
    </SkeletonGroup>
  )
})

export default ChatSkeleton
