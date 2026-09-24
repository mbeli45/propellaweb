import React from 'react'
import { ListItemSkeleton } from './ListItemSkeleton'

interface MessageListSkeletonProps {
  count?: number
}

/** Placeholder for the conversations list: avatar, name, preview, time. */
export const MessageListSkeleton = React.memo<MessageListSkeletonProps>(function MessageListSkeleton({ count = 6 }) {
  return <ListItemSkeleton count={count} leading="avatar" leadingSize={48} lines={2} trailing="text" />
})

export default MessageListSkeleton
