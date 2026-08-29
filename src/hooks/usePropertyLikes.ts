import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { captureException } from '@/lib/sentry';

/**
 * Like state for a single property, with an optimistic toggle.
 *
 * Mirrors `useSavedProperty`, but likes are public, so the total is fetched
 * alongside the viewer's own row. There is no denormalised counter on
 * `properties`: that table stamps `updated_at` on every UPDATE, so a counter
 * there would make each like look like an edit to the listing. Counting
 * against the `property_likes(property_id)` index is cheap, and only the
 * property currently on screen mounts this hook.
 */
export function usePropertyLike(userId: string | undefined, propertyId: string | undefined) {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!propertyId) {
        setIsLiked(false);
        setLikeCount(0);
        return;
      }

      const [countResult, likedResult] = await Promise.all([
        supabase
          .from('property_likes')
          .select('id', { count: 'exact', head: true })
          .eq('property_id', propertyId),
        userId
          ? supabase
              .from('property_likes')
              .select('id')
              .eq('user_id', userId)
              .eq('property_id', propertyId)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null } as const),
      ]);

      if (cancelled) return;

      if (countResult.error) {
        captureException(countResult.error, { context: 'usePropertyLike.count', propertyId });
      } else {
        setLikeCount(countResult.count ?? 0);
      }

      if (likedResult.error) {
        captureException(likedResult.error, {
          context: 'usePropertyLike.checkLiked',
          userId,
          propertyId,
        });
        return;
      }
      setIsLiked(!!likedResult.data);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [userId, propertyId]);

  const toggleLike = useCallback(async () => {
    if (!userId || !propertyId || loading) {
      return { ok: false as const, requiresAuth: !userId };
    }

    const next = !isLiked;
    setIsLiked(next);
    setLikeCount((prev) => Math.max(0, prev + (next ? 1 : -1)));
    setLoading(true);

    try {
      if (next) {
        const { error } = await supabase
          .from('property_likes')
          .upsert({ user_id: userId, property_id: propertyId }, { onConflict: 'user_id,property_id' });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('property_likes')
          .delete()
          .eq('user_id', userId)
          .eq('property_id', propertyId);
        if (error) throw error;
      }
      return { ok: true as const, isLiked: next };
    } catch (e: any) {
      setIsLiked(!next);
      setLikeCount((prev) => Math.max(0, prev + (next ? -1 : 1)));
      captureException(e, { context: 'usePropertyLike.toggleLike', userId, propertyId });
      return { ok: false as const, requiresAuth: false, error: e?.message };
    } finally {
      setLoading(false);
    }
  }, [userId, propertyId, isLiked, loading]);

  return { isLiked, likeCount, loading, toggleLike };
}
