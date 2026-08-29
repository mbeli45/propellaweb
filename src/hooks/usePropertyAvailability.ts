import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { captureException } from '@/lib/sentry';

/**
 * Availability re-confirmation.
 *
 * A listing can sit on the market long after it has been taken, so owners are
 * asked to re-confirm periodically and clients see when that last happened.
 * This is deliberately separate from `verification_status`, which is the admin
 * document check and does not go stale.
 */

/** Past this age a listing is shown as needing re-confirmation. */
export const AVAILABILITY_STALE_DAYS = 14;

const DAY_MS = 24 * 60 * 60 * 1000;

export function daysSinceConfirmed(confirmedAt: string | null | undefined): number | null {
  if (!confirmedAt) return null;
  const timestamp = new Date(confirmedAt).getTime();
  if (!Number.isFinite(timestamp)) return null;
  return Math.floor((Date.now() - timestamp) / DAY_MS);
}

export function isAvailabilityStale(confirmedAt: string | null | undefined): boolean {
  const days = daysSinceConfirmed(confirmedAt);
  // Never confirmed reads as stale — that is exactly the case worth flagging.
  if (days === null) return true;
  return days >= AVAILABILITY_STALE_DAYS;
}

type Translate = (key: string, options?: any) => string;

/**
 * "Last verified today" / "Last verified 3 days ago" / "Last verified 12 Aug 2026".
 * Falls back to an absolute date past a fortnight, where "38 days ago" stops
 * being easier to read than the date itself.
 */
export function formatLastVerified(
  confirmedAt: string | null | undefined,
  t: Translate,
  locale = 'en'
): string {
  const days = daysSinceConfirmed(confirmedAt);
  if (days === null) return t('availability.neverVerified', 'Not yet verified');

  if (days <= 0) return t('availability.verifiedToday', 'Last verified today');
  if (days === 1) return t('availability.verifiedYesterday', 'Last verified yesterday');
  if (days < AVAILABILITY_STALE_DAYS) {
    // Named `days` rather than `count` so i18next treats it as a plain
    // interpolation instead of switching on plural rules; this branch is
    // only ever reached with 2 or more days.
    return t('availability.verifiedDaysAgo', {
      days,
      defaultValue: 'Last verified {{days}} days ago',
    });
  }

  const date = new Date(confirmedAt as string);
  const formatted = date.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  return t('availability.verifiedOn', {
    date: formatted,
    defaultValue: 'Last verified {{date}}',
  });
}

/**
 * `missing_media` means the row tripped `properties_media_min_items_check`.
 * That constraint was added NOT VALID, so listings created before it exist
 * with no images and are rejected by *any* UPDATE of the row - including
 * this one. The owner has to add a photo before the listing can be touched
 * again, so the caller needs to say that rather than "try again".
 */
export type ConfirmAvailabilityFailureReason = 'missing_media' | 'unknown';

export type ConfirmAvailabilityResult =
  // `reason` is declared on the success arm too so callers can read it off
  // the union directly: the web app compiles with `strict: false`, where a
  // boolean literal is not treated as a discriminant and `if (result.ok)`
  // does not narrow.
  | { ok: true; confirmedAt: string; reason?: undefined }
  | { ok: false; error?: string; reason?: ConfirmAvailabilityFailureReason };

/**
 * Stamp a listing as re-confirmed. Scoped to the owner so a mis-wired caller
 * can never re-confirm someone else's listing, independently of the RLS policy.
 */
export async function confirmPropertyAvailability(
  propertyId: string,
  ownerId: string
): Promise<ConfirmAvailabilityResult> {
  const now = new Date().toISOString();
  try {
    const { data, error } = await supabase
      .from('properties')
      .update({ availability_confirmed_at: now, availability_confirmed_by: ownerId })
      .eq('id', propertyId)
      .eq('owner_id', ownerId)
      .select('availability_confirmed_at')
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error('Property not found or not owned by the current user');

    return { ok: true, confirmedAt: data.availability_confirmed_at ?? now };
  } catch (e: any) {
    // 23514 is Postgres' check_violation.
    const reason: ConfirmAvailabilityFailureReason =
      e?.code === '23514' && String(e?.message ?? '').includes('media_min_items')
        ? 'missing_media'
        : 'unknown';

    captureException(e, {
      context: 'confirmPropertyAvailability',
      propertyId,
      ownerId,
      reason,
    });
    return { ok: false, error: e?.message as string | undefined, reason };
  }
}

/**
 * Confirmation state for one listing. `initialConfirmedAt` seeds the value from
 * whatever the list query already loaded so the label renders without a second
 * round trip; the hook only talks to the network when the owner confirms.
 */
export function usePropertyAvailability(
  propertyId: string | undefined,
  ownerId: string | undefined,
  initialConfirmedAt?: string | null
) {
  const [confirmedAt, setConfirmedAt] = useState<string | null>(initialConfirmedAt ?? null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    setConfirmedAt(initialConfirmedAt ?? null);
  }, [initialConfirmedAt, propertyId]);

  const confirmAvailability = useCallback(async (): Promise<ConfirmAvailabilityResult> => {
    if (!propertyId || !ownerId || confirming) {
      return { ok: false, error: undefined, reason: 'unknown' };
    }

    const previous = confirmedAt;
    setConfirmedAt(new Date().toISOString());
    setConfirming(true);

    const result = await confirmPropertyAvailability(propertyId, ownerId);
    if (result.ok) {
      setConfirmedAt(result.confirmedAt);
    } else {
      setConfirmedAt(previous);
    }
    setConfirming(false);
    return result;
  }, [propertyId, ownerId, confirmedAt, confirming]);

  return {
    confirmedAt,
    confirming,
    isStale: isAvailabilityStale(confirmedAt),
    confirmAvailability,
  };
}
