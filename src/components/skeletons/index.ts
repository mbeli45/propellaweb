/**
 * Standard loading placeholders for the web app (mirrors the mobile set).
 *
 * Rule of thumb:
 * - Content that is loading (lists, details, dashboards, forms with remote
 *   data) -> render a skeleton from here, shaped like the content it replaces.
 * - An action in progress (submitting, uploading, paying) or a pure
 *   redirect/boot transition -> keep a spinner (Button `loading`,
 *   `<Loader variant="button" />`, or the boot LoadingScreen).
 * - "Load more" / refresh on a list that already shows data -> keep the
 *   inline button state.
 *
 * Only show a skeleton when there is nothing to show yet
 * (e.g. `loading && items.length === 0`), so refreshes don't blank the page.
 */

export { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton'
export { SkeletonText } from './SkeletonText'
export { ListItemSkeleton } from './ListItemSkeleton'
export { PropertyCardSkeleton } from './PropertyCardSkeleton'
export { PropertyDetailSkeleton } from './PropertyDetailSkeleton'
export { ReservationCardSkeleton } from './ReservationCardSkeleton'
export { MessageListSkeleton } from './MessageListSkeleton'
export { ChatSkeleton } from './ChatSkeleton'
export { ProfileSkeleton } from './ProfileSkeleton'
export { AgentProfileSkeleton } from './AgentProfileSkeleton'
export { DashboardSkeleton } from './DashboardSkeleton'
export { FormSkeleton } from './FormSkeleton'
export { MapSkeleton } from './MapSkeleton'
