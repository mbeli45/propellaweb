import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Database, TablesInsert, TablesUpdate } from '@/types/supabase';

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
  const [hasConfirmedBooking, setHasConfirmedBooking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkPropertyReservation = useCallback(async () => {
    if (!userId || !propertyId) {
      setHasConfirmedBooking(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reservations')
        .select('id, status')
        .eq('user_id', userId)
        .eq('property_id', propertyId)
        .eq('status', 'confirmed')
        .limit(1);

      if (error) throw error;
      setHasConfirmedBooking(data && data.length > 0);
    } catch (err: any) {
      setError(err.message);
      setHasConfirmedBooking(false);
    } finally {
      setLoading(false);
    }
  }, [userId, propertyId]);

  useEffect(() => {
    checkPropertyReservation();
  }, [checkPropertyReservation]);

  return { hasConfirmedBooking, loading, error, refetch: checkPropertyReservation };
}
