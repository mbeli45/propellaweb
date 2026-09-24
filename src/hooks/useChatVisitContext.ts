import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Active site visits (pending or confirmed) keyed by chat counterpart, so the
 * conversations list can tag "Visit 14:00" or a booking reference.
 *
 * - customer: the counterpart is the listing owner of a visit they booked
 * - agent:    the counterpart is the visitor on one of their listings
 */
export interface ChatVisit {
  id: string;
  status: string;
  reservation_date: string | null;
  reservation_time: string | null;
}

type Audience = 'customer' | 'agent';

export function useChatVisitContext(userId: string | undefined, audience: Audience) {
  const [rows, setRows] = useState<any[]>([]);

  const refresh = useCallback(async () => {
    if (!userId) {
      setRows([]);
      return;
    }
    try {
      const base = supabase
        .from('reservations')
        .select('id,status,reservation_date,reservation_time,user_id,property:property_id!inner(owner_id)')
        .in('status', ['pending', 'confirmed'])
        .order('reservation_date', { ascending: true });
      const { data, error } =
        audience === 'agent'
          ? await base.eq('property.owner_id', userId)
          : await base.eq('user_id', userId);
      if (error) throw error;
      setRows(data || []);
    } catch (error) {
      // Visit tags are supplementary; never block the chat list on them.
      console.warn('useChatVisitContext: unable to load visits', error);
      setRows([]);
    }
  }, [userId, audience]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const byCounterpart = useMemo(() => {
    const map = new Map<string, ChatVisit>();
    for (const row of rows) {
      const counterpartId = audience === 'agent' ? row.user_id : row.property?.owner_id;
      // Rows are ordered by date, so the first one per counterpart is the next visit.
      if (counterpartId && !map.has(counterpartId)) {
        map.set(counterpartId, {
          id: row.id,
          status: row.status,
          reservation_date: row.reservation_date,
          reservation_time: row.reservation_time,
        });
      }
    }
    return map;
  }, [rows, audience]);

  return { byCounterpart, refresh };
}
