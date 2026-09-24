import { useCallback, useEffect, useMemo, useState } from 'react';
import { dealDb } from '@/lib/deals';

/**
 * The slice of a property deal needed to show its status next to the
 * reservation that created it. The full deal workflow lives in /user/deals
 * (useDeals); this hook deliberately loads only one narrow query so the
 * reservations tabs stay fast.
 */
export interface ReservationDeal {
  id: string;
  reservation_id: string | null;
  status: string;
  customer_id: string | null;
  agent_id: string | null;
  agency_accepted_at: string | null;
  customer_closed_at: string | null;
  commission_amount: number | null;
}

const CLOSED_STATUSES = ['settled', 'cancelled'];
const LOCKED_STATUSES = ['payment_pending', 'paid', 'settled', 'cancelled'];

/** Mirrors the customer/agent actions offered by dealForms in lib/deals. */
export function dealNeedsAction(deal: ReservationDeal, userId: string) {
  if (deal.customer_id === userId) {
    return deal.status === 'quoted' || deal.status === 'closing';
  }
  if (deal.agent_id === userId) {
    if (LOCKED_STATUSES.includes(deal.status) || deal.customer_closed_at) return false;
    return !deal.agency_accepted_at || deal.status === 'searching' || deal.status === 'accepted';
  }
  return false;
}

export function useReservationDeals(userId: string | undefined) {
  const [deals, setDeals] = useState<ReservationDeal[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) {
      setDeals([]);
      setLoading(false);
      return;
    }
    try {
      // RLS limits property_deals to the deals this user is a party to.
      const { data, error } = await dealDb
        .from('property_deals')
        .select('id,reservation_id,status,customer_id,agent_id,agency_accepted_at,customer_closed_at,commission_amount')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      setDeals((data as ReservationDeal[]) || []);
    } catch (error) {
      // Deal status is supplementary on this screen; never block reservations on it.
      console.warn('useReservationDeals: unable to load deals', error);
      setDeals([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return useMemo(() => {
    const byReservation = new Map<string, ReservationDeal>();
    for (const deal of deals) {
      if (deal.reservation_id && !byReservation.has(deal.reservation_id)) {
        byReservation.set(deal.reservation_id, deal);
      }
    }
    const active = deals.filter((deal) => !CLOSED_STATUSES.includes(deal.status));
    const needsAction = userId ? active.filter((deal) => dealNeedsAction(deal, userId)) : [];
    return {
      deals,
      byReservation,
      activeCount: active.length,
      needsActionCount: needsAction.length,
      loading,
      refresh,
    };
  }, [deals, loading, refresh, userId]);
}
