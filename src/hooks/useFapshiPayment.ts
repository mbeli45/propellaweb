import { useState, useEffect, useRef } from 'react';
import { 
  generatePaymentLink, 
  openPaymentLink, 
  storeTransactionId,
  pollPaymentStatus,
  initiateDirectPayment
} from '@/lib/fapshi';
import { supabase } from '@/lib/supabase';

export function useFapshiPayment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus] = useState(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [monitoringProgress, setMonitoringProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number>(300);
  const [currentStatus, setCurrentStatus] = useState<string>('PENDING');
  
  const monitoringRef = useRef<{
    interval: NodeJS.Timeout | null;
    timeout: NodeJS.Timeout | null;
    progress: NodeJS.Timeout | null;
  }>({
    interval: null,
    timeout: null,
    progress: null,
  });

  // Process payment for a reservation
  const processPayment = async (
    reservationId: string,
    amount: number,
    userId: string,
    propertyTitle: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      console.log('[useFapshiPayment] processPayment called', { reservationId, amount, userId, propertyTitle });

      // Generate a payment link
      const { link, transId } = await generatePaymentLink(amount, {
        userId,
        externalId: reservationId,
        message: `Payment for reservation of ${propertyTitle}`,
      });

      console.log('[useFapshiPayment] Payment link generated', { link, transId });

      // Store the transaction ID for later verification
      await storeTransactionId(reservationId, transId);

      // Update reservation with transaction ID
      const { error: updateError } = await supabase
        .from('reservations')
        .update({ 
          transaction_id: transId,
          payment_status: 'PENDING'
        })
        .eq('id', reservationId);

      if (updateError) {
        console.error('[useFapshiPayment] Failed to update reservation', updateError);
        throw new Error(`Failed to update reservation: ${updateError.message}`);
      }

      // Open the payment link in a browser
      await openPaymentLink(link);

      // Automatically start monitoring the payment status
      startPaymentMonitoring(reservationId, transId);

      return { transId };
    } catch (error: any) {
      setError(error.message || 'Failed to process payment');
      console.error('[useFapshiPayment] processPayment error', error);
      alert(`Payment Error: ${error.message || 'Failed to process payment'}`);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Process payment using Fapshi Direct Pay (no links)
  const processDirectPayment = async (
    amount: number,
    userId: string,
    phone: string,
    options?: { message?: string; medium?: 'mobile money' | 'orange money'; name?: string; email?: string; externalId?: string }
  ) => {
    try {
      setLoading(true);
      setError(null);
      console.log('[useFapshiPayment] processDirectPayment called', { amount, userId, phone, options });
      const { transId } = await initiateDirectPayment(amount, phone, {
        userId: options?.externalId ? undefined : userId,
        externalId: options?.externalId,
        message: options?.message,
        medium: options?.medium,
        name: options?.name,
        email: options?.email,
      });
      return { transId };
    } catch (error: any) {
      setError(error.message || 'Failed to initiate direct payment');
      console.error('[useFapshiPayment] processDirectPayment error', error);
      alert(`Payment Error: ${error.message || 'Failed to initiate payment'}`);
      throw error;
    } finally {
      setLoading(false);
    }
  };



  // Start automatic payment monitoring
  const startPaymentMonitoring = async (reservationId: string, transId: string) => {
    try {
      setIsMonitoring(true);
      setMonitoringProgress(0);
      setCurrentStatus('PENDING');
      setTimeRemaining(300);

      console.log('[useFapshiPayment] Starting automatic payment monitoring', { reservationId, transId });

      // Set up 5-minute timeout
      monitoringRef.current.timeout = setTimeout(() => {
        console.log('[useFapshiPayment] Payment monitoring timed out after 5 minutes');
        stopPaymentMonitoring();
        alert('Payment Timeout: Payment verification timed out. Please check your payment status manually.');
      }, 300000); // 5 minutes

      // Set up progress tracking (0-100% over 5 minutes)
      let progress = 0;
      monitoringRef.current.progress = setInterval(() => {
        progress += (100 / 300); // 300 seconds = 5 minutes
        setMonitoringProgress(Math.min(progress, 100));
        setTimeRemaining(prev => Math.max(0, prev - 1));
      }, 1000);

      // Set up polling interval (check every 10 seconds)
      monitoringRef.current.interval = setInterval(async () => {
        try {
          console.log('[useFapshiPayment] Checking payment status...');
          
          const status = await pollPaymentStatus(transId, {
            interval: 2000,
            maxAttempts: 1, // Only check once per interval
            timeout: 8000,
          });

          setCurrentStatus(status.status);
          console.log('[useFapshiPayment] Payment status:', status.status);

          // Check if we have a final status
          if (status.status === 'SUCCESSFUL' || status.status === 'FAILED' || status.status === 'EXPIRED') {
            console.log('[useFapshiPayment] Final status reached:', status.status);
            
            // Update database
            await updatePaymentStatus(reservationId, status);
            
            // Stop monitoring
            stopPaymentMonitoring();
            
            if (status.status === 'SUCCESSFUL') {
              setMonitoringProgress(100);
              alert('Payment Successful! Your payment has been confirmed. Your reservation is now active.');
            } else {
              alert(`Payment Failed: Your payment was ${status.status.toLowerCase()}. Please try again.`);
            }
          }
        } catch (pollError: any) {
          console.error('[useFapshiPayment] Polling error:', pollError);
          // Don't stop monitoring on network errors, just log them
        }
      }, 10000); // Check every 10 seconds

    } catch (error: any) {
      console.error('[useFapshiPayment] Failed to start monitoring:', error);
      stopPaymentMonitoring();
    }
  };

  const stopPaymentMonitoring = () => {
    console.log('[useFapshiPayment] Stopping payment monitoring');
    
    if (monitoringRef.current.interval) {
      clearInterval(monitoringRef.current.interval);
      monitoringRef.current.interval = null;
    }
    
    if (monitoringRef.current.timeout) {
      clearTimeout(monitoringRef.current.timeout);
      monitoringRef.current.timeout = null;
    }
    
    if (monitoringRef.current.progress) {
      clearInterval(monitoringRef.current.progress);
      monitoringRef.current.progress = null;
    }
    
    setIsMonitoring(false);
    setMonitoringProgress(0);
    setTimeRemaining(300);
  };

  const updatePaymentStatus = async (reservationId: string, status: any) => {
    try {
      // First, get the reservation to find the property_id
      const { data: reservation, error: fetchError } = await supabase
        .from('reservations')
        .select('property_id')
        .eq('id', reservationId)
        .single();

      if (fetchError) {
        console.error('[useFapshiPayment] Failed to fetch reservation:', fetchError);
      }

      // Update reservation payment status
      const { error } = await supabase
        .from('reservations')
        .update({ 
          payment_status: status.status,
          status: status.status === 'SUCCESSFUL' ? 'confirmed' : 'pending',
          paid_at: status.status === 'SUCCESSFUL' ? new Date().toISOString() : null,
        })
        .eq('id', reservationId);

      if (error) {
        console.error('[useFapshiPayment] Failed to update payment status:', error);
      }

      // If payment successful, update property status to reserved
      if (status.status === 'SUCCESSFUL' && reservation?.property_id) {
        const { error: propertyError } = await supabase
          .from('properties')
          .update({ status: 'reserved' })
          .eq('id', reservation.property_id);

        if (propertyError) {
          console.error('[useFapshiPayment] Failed to update property status:', propertyError);
        } else {
          console.log('[useFapshiPayment] Property status updated to reserved');
        }
      }
    } catch (error) {
      console.error('[useFapshiPayment] Error updating payment status:', error);
    }
  };

  // Get all transactions for a user
  const getUserPaymentHistory = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Get transactions from Supabase
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          reservations (
            *,
            property:property_id (
              title,
              location
            )
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch transactions: ${error.message}`);
      }

      return data;
    } catch (error: any) {
      setError(error.message || 'Failed to fetch payment history');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Only stop monitoring if it's actually running
      if (monitoringRef.current.interval || monitoringRef.current.timeout || monitoringRef.current.progress) {
        stopPaymentMonitoring();
      }
    };
  }, []);

  const formatTimeRemaining = () => {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return {
    loading,
    error,
    paymentStatus,
    isMonitoring,
    monitoringProgress,
    currentStatus,
    timeRemaining: formatTimeRemaining(),
    processPayment,
    processDirectPayment,
    getUserPaymentHistory,
    stopPaymentMonitoring
  };
}
