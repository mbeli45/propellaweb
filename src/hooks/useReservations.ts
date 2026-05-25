import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Database, TablesInsert, TablesUpdate } from '@/types/supabase';
import { captureException, addBreadcrumb } from '@/lib/sentry';

type Reservation = Database['public']['Tables']['reservations']['Row'];

// Extended reservation type with property details
type ReservationWithProperty = Reservation & {
  property?: {
    id: string;
    title: string;
    location: string;
    images: string[] | null;
    price: number;
    bedrooms: number | null;
    bathrooms: number | null;
    area: number | null;
  } | null;
};

type ReservationInsert = TablesInsert<'reservations'>;
type ReservationUpdate = TablesUpdate<'reservations'>;

export function useReservations(userId: string) {
  const [reservations, setReservations] = useState<ReservationWithProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReservations = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          property:properties(
            id,
            title,
            location,
            images,
            price,
            bedrooms,
            bathrooms,
            area
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setReservations(data || []);
    } catch (error: any) {
      console.error('Error fetching reservations:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const handleReservationChange = useCallback((payload: any) => {
    if (payload.eventType === 'INSERT') {
      // For new reservations, we need to fetch the property details
      fetchReservations();
    } else if (payload.eventType === 'UPDATE') {
      setReservations(prev =>
        prev.map(reservation =>
          reservation.id === payload.new.id ? { ...reservation, ...payload.new } : reservation
        )
      );
    } else if (payload.eventType === 'DELETE') {
      setReservations(prev =>
        prev.filter(reservation => reservation.id !== payload.old.id)
      );
    }
  }, [fetchReservations]);

  useEffect(() => {
    fetchReservations();
    
    const subscription = supabase
      .channel(`reservations_channel_${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'reservations',
        filter: `user_id=eq.${userId}`,
      }, handleReservationChange)
      .subscribe();
      
    return () => {
      subscription.unsubscribe();
    };
  }, [userId, fetchReservations, handleReservationChange]);

  const createReservation = async (
    propertyId: string, 
    reservation_date: string, 
    reservation_time: string | null,
    options?: {
      status?: string;
      amount?: number;
      transaction_id?: string;
      payment_status?: string;
      paid_at?: string;
    }
  ) => {
    try {
      addBreadcrumb({
        category: 'reservation',
        message: 'Creating reservation',
        level: 'info',
        data: { propertyId, userId, amount: options?.amount }
      });

      const insertData: ReservationInsert = {
        user_id: userId,
        property_id: propertyId,
        reservation_date,
        reservation_time,
        status: options?.status || 'pending',
        amount: options?.amount || 0,
        transaction_id: options?.transaction_id || null,
        payment_status: options?.payment_status || null,
        paid_at: options?.paid_at || null,
      };
      
      console.log('Creating reservation with data:', insertData);
      
      const { data, error } = await supabase
        .from('reservations')
        .insert(insertData)
        .select()
        .single();
      if (error) {
        console.error('Reservation creation error:', error);
        throw error;
      }

      addBreadcrumb({
        category: 'reservation',
        message: 'Reservation created successfully',
        level: 'info',
        data: { reservationId: data.id }
      });

      // Persist property status to 'reserved' on successful reservation creation
      try {
        const { error: updateError } = await supabase
          .from('properties')
          .update({ status: 'reserved' })
          .eq('id', propertyId);
        if (updateError) {
          console.error('Failed to update property status to reserved:', updateError);
        }
      } catch (updateErr) {
        console.error('Unexpected error updating property status:', updateErr);
      }
      return data;
    } catch (error: any) {
      console.error('Reservation creation failed:', error);
      setError(error.message);
      captureException(error, { 
        context: 'useReservations.createReservation',
        propertyId,
        userId,
        options 
      });
      throw error;
    }
  };

  // Debug function to test reservation creation
  const debugCreateReservation = async (propertyId: string, amount: number, transactionId?: string) => {
    try {
      console.log('Debug: Testing reservation creation...');
      console.log('Debug: User ID:', userId);
      console.log('Debug: Property ID:', propertyId);
      console.log('Debug: Amount:', amount);
      
      // Format date correctly
      const today = new Date();
      const reservationDate = today.toISOString().split('T')[0];
      
      // Get current time in GMT+1 (Central African Time)
      const now = new Date();
      const gmtPlus1Time = new Date(now.getTime() + (1 * 60 * 60 * 1000)); // Add 1 hour for GMT+1
      const reservationTime = gmtPlus1Time.toTimeString().split(' ')[0]; // Format: HH:MM:SS
      
      const insertData: ReservationInsert = {
        user_id: userId,
        property_id: propertyId,
        reservation_date: reservationDate,
        reservation_time: reservationTime,
        status: 'confirmed',
        amount: amount,
        transaction_id: transactionId || null,
        payment_status: 'paid',
        paid_at: new Date().toISOString(),
      };
      
      console.log('Debug: Insert data:', insertData);
      
      const { data, error } = await supabase
        .from('reservations')
        .insert(insertData)
        .select()
        .single();
        
      if (error) {
        console.error('Debug: Reservation creation error:', error);
        throw error;
      }
      // Persist property status to 'reserved' in debug flow as well
      try {
        const { error: updateError } = await supabase
          .from('properties')
          .update({ status: 'reserved' })
          .eq('id', propertyId);
        if (updateError) {
          console.error('Debug: Failed to update property status to reserved:', updateError);
        }
      } catch (updateErr) {
        console.error('Debug: Unexpected error updating property status:', updateErr);
      }
      console.log('Debug: Reservation created successfully:', data);
      return data;
    } catch (error: any) {
      console.error('Debug: Reservation creation failed:', error);
      setError(error.message);
      throw error;
    }
  };

  const cancelReservation = async (reservationId: string) => {
    try {
      const updateData: ReservationUpdate = {
        status: 'cancelled',
      };
      const { error } = await supabase
        .from('reservations')
        .update(updateData)
        .eq('id', reservationId)
        .eq('user_id', userId);
      if (error) throw error;
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  // Apply a payment-outcome update to an existing pending reservation row.
  // The booking flow pre-inserts a `pending` reservation before initiating MeSomb;
  // this finalises it once the polling loop sees a definitive status. Filtered to
  // `status=pending` so re-calls (e.g. retries) don't stomp on a confirmed row.
  const updateReservationPayment = async (
    reservationId: string,
    propertyId: string,
    outcome: 'confirmed' | 'failed',
    extra?: { transaction_id?: string },
  ) => {
    try {
      const updateData: ReservationUpdate =
        outcome === 'confirmed'
          ? {
              status: 'confirmed',
              payment_status: 'paid',
              paid_at: new Date().toISOString(),
              transaction_id: extra?.transaction_id ?? null,
            }
          : {
              status: 'cancelled',
              payment_status: 'failed',
              transaction_id: extra?.transaction_id ?? null,
            };

      const { error } = await supabase
        .from('reservations')
        .update(updateData)
        .eq('id', reservationId)
        .eq('user_id', userId)
        .eq('status', 'pending');

      if (error) {
        console.error('updateReservationPayment failed:', error);
        return;
      }

      // createReservation marks the property `reserved` optimistically — free it
      // up again if the payment didn't go through.
      if (outcome === 'failed') {
        const { error: revertErr } = await supabase
          .from('properties')
          .update({ status: 'available' })
          .eq('id', propertyId);
        if (revertErr) console.error('Failed to revert property status:', revertErr);
      }
    } catch (err: any) {
      console.error('Unexpected updateReservationPayment error:', err);
    }
  };

  // Request refund - calls edge function to process the refund
  const requestRefund = async (reservationId: string) => {
    try {
      // First update the refund status to 'requested'
      const updateData: ReservationUpdate = {
        status: 'cancelled',
      };
      const { error: updateError } = await supabase
        .from('reservations')
        .update(updateData)
        .eq('id', reservationId)
        .eq('user_id', userId);
      
      if (updateError) throw updateError;

      // Then call the edge function to process the actual refund
      console.log('[useReservations] Calling process-refund edge function');
      const { data, error: refundError } = await supabase.functions.invoke('process-refund', {
        body: { reservation_id: reservationId },
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (refundError) {
        console.error('[useReservations] Refund processing error:', refundError);
        throw new Error(refundError.message || 'Failed to process refund');
      }

      if (!(data as any)?.success) {
        throw new Error((data as any)?.error || 'Refund failed');
      }

      console.log('[useReservations] Refund processed successfully:', data);
      return data;
    } catch (error: any) {
      console.error('[useReservations] requestRefund error:', error);
      setError(error.message);
      throw error;
    }
  };

  return {
    reservations,
    loading,
    error,
    createReservation,
    debugCreateReservation,
    cancelReservation,
    updateReservationPayment,
    requestRefund,
    refreshReservations: fetchReservations,
  };
}

// New hook: Get all reservations for properties owned by an agent/landlord
export function useAgentPropertyReservations(agentId: string) {
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgentReservations = useCallback(async () => {
    if (!agentId) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      // 1. Get all property IDs owned by the agent
      const { data: properties, error: propError } = await supabase
        .from('properties')
        .select('id')
        .eq('owner_id', agentId);
      if (propError) throw propError;
      const propertyIds = (properties || []).map((p: any) => p.id);
      if (propertyIds.length === 0) {
        setReservations([]);
        setLoading(false);
        return;
      }
      // 2. Get all reservations for those properties, join with user and property info
      const { data: reservationsData, error: resError } = await supabase
        .from('reservations')
        .select(`*, property:property_id(*), user: user_id(full_name, email, avatar_url)`) // join property and user
        .in('property_id', propertyIds)
        .order('created_at', { ascending: false });
      if (resError) throw resError;
      setReservations(reservationsData || []);
    } catch (err: any) {
      console.error('Error fetching agent reservations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    fetchAgentReservations();
  }, [fetchAgentReservations]);

  return { reservations, loading, error, refetch: fetchAgentReservations };
}

// Optimized hook for checking specific property reservation
export function usePropertyReservation(userId: string, propertyId: string) {
  const [hasActiveBooking, setHasActiveBooking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkPropertyReservation = useCallback(async () => {
    if (!userId || !propertyId) {
      setHasActiveBooking(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reservations')
        .select('id, status')
        .eq('user_id', userId)
        .eq('property_id', propertyId)
        .in('status', ['pending', 'confirmed'])
        .limit(1);

      if (error) throw error;
      setHasActiveBooking(!!data && data.length > 0);
    } catch (err: any) {
      setError(err.message);
      setHasActiveBooking(false);
    } finally {
      setLoading(false);
    }
  }, [userId, propertyId]);

  useEffect(() => {
    checkPropertyReservation();
  }, [checkPropertyReservation]);

  // Realtime sync: refetch when this user's reservation for this property changes.
  // Covers (a) mesomb-webhook flipping a pending row to confirmed while the user
  // sits on the property page, (b) the second device case, and (c) the client
  // poll-timeout case where the modal closes with a still-pending row — without
  // this the button would stay on "Book Site Visit" and the user could create a
  // duplicate reservation by tapping again.
  useEffect(() => {
    if (!userId || !propertyId) return;
    const channel = supabase
      .channel(`property_reservation_${userId}_${propertyId}_${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reservations',
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          const row = payload.new ?? payload.old;
          if (row?.property_id === propertyId) {
            checkPropertyReservation();
          }
        },
      )
      .subscribe();
    return () => {
      try { supabase.removeChannel(channel); } catch { /* noop */ }
    };
  }, [userId, propertyId, checkPropertyReservation]);

  return { hasActiveBooking, loading, error, refetch: checkPropertyReservation };
}
