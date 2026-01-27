import { useState, useEffect } from 'react';

import { supabase } from '@/lib/supabase';
import { generatePaymentLink, openPaymentLink, pollPaymentStatus } from '@/lib/fapshi';

export interface CommissionPayment {
  id: string;
  user_id: string;
  agent_id: string;
  property_id: string;
  reservation_id: string;
  amount: number;
  platform_fee: number;
  agent_amount: number;
  status: 'pending' | 'paid' | 'released' | 'refunded' | 'cancelled';
  payment_method?: 'mtn' | 'orange';
  transaction_id?: string;
  payment_reference?: string;
  escrow_status: 'holding' | 'released' | 'refunded';
  release_date?: string;
  paid_at?: string;
  released_at?: string;
  created_at: string;
  updated_at: string;
}

export function useCommissionPayment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<any>(null);

  const createCommissionPayment = async (
    userId: string,
    agentId: string,
    propertyId: string,
    reservationId: string,
    amount: number,
    paymentMethod: 'mtn' | 'orange',
    phoneNumber: string
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      // Calculate platform fee (30%) and agent amount (70%)
      const platformFee = Math.round(amount * 0.3 * 100) / 100;
      const agentAmount = amount - platformFee;
      
      // Generate unique payment reference
      const paymentReference = `COM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // 1. Create commission payment record
      const { data: commissionPayment, error: insertError } = await supabase
        .from('commission_payments')
        .insert({
          user_id: userId,
          agent_id: agentId,
          property_id: propertyId,
          reservation_id: reservationId,
          amount,
          platform_fee: platformFee,
          agent_amount: agentAmount,
          payment_method: paymentMethod,
          payment_reference: paymentReference,
          status: 'pending',
          escrow_status: 'holding'
        })
        .select()
        .single();
        
      if (insertError) throw insertError;
      
      // 2. Generate Fapshi payment link
      const { link, transId } = await generatePaymentLink(amount, {
        userId,
        externalId: commissionPayment.id,
        message: `Agent Commission Payment - ${paymentReference}`,
      });
      
      // 3. Update commission payment with transaction ID
      const { error: updateError } = await supabase
        .from('commission_payments')
        .update({ transaction_id: transId })
        .eq('id', commissionPayment.id);
        
      if (updateError) throw updateError;
      
      // 4. Open payment link
      await openPaymentLink(link);
      
      // 5. Start monitoring payment status
      startPaymentMonitoring(commissionPayment.id, transId);
      
      setPaymentStatus({
        commissionPayment: { ...commissionPayment, transaction_id: transId },
        transId
      });
      
      return {
        commissionPayment: { ...commissionPayment, transaction_id: transId },
        transId
      };
      
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const startPaymentMonitoring = async (commissionPaymentId: string, transId: string) => {
    console.log('[useCommissionPayment] Starting payment monitoring', { commissionPaymentId, transId });
    
    // Poll every 10 seconds for up to 5 minutes
    const pollInterval = setInterval(async () => {
      try {
        const status = await pollPaymentStatus(transId, {
          interval: 2000,
          maxAttempts: 1,
          timeout: 8000,
        });
        
        console.log('[useCommissionPayment] Payment status:', status.status);
        
        if (status.status === 'SUCCESSFUL') {
          // Update commission payment status
          await updateCommissionPaymentStatus(commissionPaymentId, 'paid', status);
          clearInterval(pollInterval);
          
          alert('Commission Payment Successful! Your commission payment has been processed and is being held securely. The agent will receive payment after the visit is confirmed and 48 hours have passed.');
        } else if (status.status === 'FAILED' || status.status === 'EXPIRED') {
          await updateCommissionPaymentStatus(commissionPaymentId, 'cancelled', status);
          clearInterval(pollInterval);
          
          alert(`Commission Payment Failed: Your payment was ${status.status.toLowerCase()}. Please try again.`);
        }
      } catch (pollError: any) {
        console.error('[useCommissionPayment] Polling error:', pollError);
      }
    }, 10000);
    
    // Stop polling after 5 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
      console.log('[useCommissionPayment] Payment monitoring timed out');
    }, 300000);
  };

  const updateCommissionPaymentStatus = async (
    commissionPaymentId: string,
    status: 'paid' | 'cancelled',
    paymentData: any
  ) => {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };
      
      if (status === 'paid') {
        updateData.paid_at = new Date().toISOString();
      }
      
      const { error } = await supabase
        .from('commission_payments')
        .update(updateData)
        .eq('id', commissionPaymentId);
        
      if (error) {
        console.error('[useCommissionPayment] Failed to update commission payment:', error);
      }
    } catch (error) {
      console.error('[useCommissionPayment] Error updating commission payment:', error);
    }
  };

  const getCommissionPayments = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('commission_payments')
        .select(`
          *,
          agent:agent_id(full_name, avatar_url, role),
          property:property_id(title, location),
          reservation:reservation_id(reservation_date, status)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getAgentCommissions = async (agentId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('commission_payments')
        .select(`
          *,
          user:user_id(full_name, avatar_url),
          property:property_id(title, location),
          reservation:reservation_id(reservation_date, status)
        `)
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createDispute = async (
    commissionPaymentId: string,
    reportedBy: string,
    disputeType: 'service_not_provided' | 'poor_service' | 'overcharge' | 'other',
    description: string
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('commission_disputes')
        .insert({
          commission_payment_id: commissionPaymentId,
          reported_by: reportedBy,
          dispute_type: disputeType,
          description
        })
        .select()
        .single();
        
      if (error) throw error;
      
      alert('Dispute Submitted: Your dispute has been submitted and will be reviewed by our team within 24 hours.');
      
      return data;
    } catch (err: any) {
      setError(err.message);
      alert('Error: Failed to submit dispute. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    paymentStatus,
    createCommissionPayment,
    getCommissionPayments,
    getAgentCommissions,
    createDispute
  };
} 
