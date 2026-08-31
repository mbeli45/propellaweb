import { supabase } from '@/lib/supabase';

/**
 * PostgREST `or=` filter restricting a properties query to what the current
 * viewer is allowed to browse.
 *
 * A listing with an active reservation is hidden from everyone except the user
 * who booked it - they keep seeing it (with a "Message the agent" call to
 * action) until the visit is done or the booking is cancelled.
 *
 * This deliberately filters on `properties.reserved_by`, which a trigger keeps
 * in step with the reservations table. The previous approach read the
 * reservations table from the client, but RLS scopes that table to the
 * caller's own rows: the exclusion list came back empty for everyone else, so
 * booked listings stayed visible to the whole platform and were hidden from
 * the only person who should still see them.
 */
export async function propertyVisibilityFilter(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user?.id;
  return userId
    ? `status.eq.available,reserved_by.eq.${userId}`
    : 'status.eq.available';
}

/** True when this listing is only visible to `userId` because they booked it. */
export function isReservedByViewer(
  property: { status?: string | null; reserved_by?: string | null },
  userId?: string | null,
): boolean {
  return Boolean(userId && property.reserved_by === userId && property.status === 'reserved');
}
