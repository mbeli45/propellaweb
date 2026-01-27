import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export function useBadgeCounts(userId: string, userRole?: string) {
  const [reservationBadgeCount, setReservationBadgeCount] = useState(0);
  const [messageBadgeCount, setMessageBadgeCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Use refs to track if we need to update to prevent unnecessary re-renders
  const lastReservationCount = useRef(0);
  const lastMessageCount = useRef(0);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Memoize the filter conditions to prevent subscription recreation
  const reservationFilter = useMemo(() => {
    if (!userId) return '';
    return userRole === 'agent' || userRole === 'landlord' 
      ? '' // We'll handle agent/landlord filtering in the callback
      : `user_id=eq.${userId}`;
  }, [userId, userRole]);

  const messageFilter = useMemo(() => {
    return userId ? `receiver_id=eq.${userId}` : '';
  }, [userId]);

  // Debounced update function to prevent rapid state changes
  const debouncedUpdate = useCallback((type: 'reservation' | 'message', count: number) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    debounceTimer.current = setTimeout(() => {
      if (type === 'reservation' && count !== lastReservationCount.current) {
        lastReservationCount.current = count;
        setReservationBadgeCount(count);
      } else if (type === 'message' && count !== lastMessageCount.current) {
        lastMessageCount.current = count;
        setMessageBadgeCount(count);
      }
    }, 300); // 300ms debounce
  }, []);

  const fetchReservationBadgeCount = useCallback(async () => {
    if (!userId) return;
    
    try {
      let query = supabase
        .from('reservations')
        .select('id, status, created_at');

      // For agents/landlords, get reservations for their properties
      if (userRole === 'agent' || userRole === 'landlord') {
        // First get the property IDs owned by this user
        const { data: properties, error: propertiesError } = await supabase
          .from('properties')
          .select('id')
          .eq('owner_id', userId);
        
        if (propertiesError) throw propertiesError;
        
        if (properties && properties.length > 0) {
          const propertyIds = properties.map(p => p.id);
          query = query.in('property_id', propertyIds);
        } else {
          // No properties found, return empty result
          debouncedUpdate('reservation', 0);
          return;
        }
      } else {
        // For regular users, get their own reservations
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query
        .in('status', ['pending', 'confirmed'])
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // Last 7 days

      if (error) throw error;
      
      const count = data?.length || 0;
      debouncedUpdate('reservation', count);
    } catch (error) {
      console.error('Error fetching reservation badge count:', error);
      debouncedUpdate('reservation', 0);
    }
  }, [userId, userRole, debouncedUpdate]);

  const fetchMessageBadgeCount = useCallback(async () => {
    if (!userId) return;
    
    try {
      // Get unread messages count
      const { data, error } = await supabase
        .from('messages')
        .select('id')
        .eq('receiver_id', userId)
        .eq('read', false);

      if (error) throw error;
      
      const count = data?.length || 0;
      debouncedUpdate('message', count);
    } catch (error) {
      console.error('Error fetching message badge count:', error);
      debouncedUpdate('message', 0);
    }
  }, [userId, debouncedUpdate]);

  const fetchBadgeCounts = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      
      // Fetch both counts in parallel for better performance
      await Promise.all([
        fetchReservationBadgeCount(),
        fetchMessageBadgeCount()
      ]);
    } catch (error) {
      console.error('Error fetching badge counts:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, fetchReservationBadgeCount, fetchMessageBadgeCount]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    fetchBadgeCounts();
    
    // Set up real-time subscriptions with reduced frequency
    let reservationSubscription: any, messageSubscription: any;
    
    // Set up reservation subscription
    reservationSubscription = supabase
      .channel('reservation_badges')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'reservations',
        filter: reservationFilter,
      }, (payload) => {
        // For agents/landlords, check if the reservation is for their property
        if (userRole === 'agent' || userRole === 'landlord') {
          // We'll let the fetchReservationBadgeCount handle the filtering
          // since it already has the logic to get user's properties
        }
        
        // Debounce the real-time updates
        if (debounceTimer.current) {
          clearTimeout(debounceTimer.current);
        }
        debounceTimer.current = setTimeout(() => {
          fetchReservationBadgeCount();
        }, 500);
      })
      .subscribe();

    if (messageFilter) {
      messageSubscription = supabase
        .channel('message_badges')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: messageFilter,
        }, () => {
          // Debounce the real-time updates
          if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
          }
          debounceTimer.current = setTimeout(() => {
            fetchMessageBadgeCount();
          }, 500);
        })
        .subscribe();
    }

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      reservationSubscription?.unsubscribe();
      messageSubscription?.unsubscribe();
    };
  }, [userId, userRole, reservationFilter, messageFilter, fetchBadgeCounts, fetchReservationBadgeCount, fetchMessageBadgeCount]);

  const clearReservationBadge = useCallback(() => {
    lastReservationCount.current = 0;
    setReservationBadgeCount(0);
  }, []);

  const clearMessageBadge = useCallback(() => {
    lastMessageCount.current = 0;
    setMessageBadgeCount(0);
  }, []);

  return {
    reservationBadgeCount,
    messageBadgeCount,
    loading,
    refreshBadgeCounts: fetchBadgeCounts,
    clearReservationBadge,
    clearMessageBadge,
  };
} 
