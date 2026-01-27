import { useState, useEffect, useRef, useCallback } from 'react';

import { supabase } from '@/lib/supabase';
import { TablesInsert } from '@/types/supabase';
import { pollWithdrawalStatus, PollingOptions, initiateWithdrawal, getWithdrawalStatus } from '@/lib/fapshi';

export function useFapshiWithdrawal(userId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [withdrawalStatus, setWithdrawalStatus] = useState<any>(null);
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

  const processFapshiWithdrawal = async (
    amount: number,
    phoneNumber: string,
    paymentMethod?: 'mtn' | 'orange',
    options?: PollingOptions
  ) => {
    setLoading(true);
    setError(null);
    try {
      console.log('[useFapshiWithdrawal] Starting withdrawal process', { 
        userId, 
        amount, 
        phoneNumber 
      });

      // 0. Check available withdrawable balance (server computes locked visitation funds)
      const { data: availableArr, error: availErr } = await supabase
        .rpc('request_withdrawal', { p_amount: amount, p_phone: phoneNumber });
      if (availErr) {
        console.error('[useFapshiWithdrawal] request_withdrawal error', availErr);
        throw new Error(availErr.message || 'Withdrawal not allowed');
      }
      const accepted = Array.isArray(availableArr) ? availableArr[0]?.accepted : (availableArr as any)?.accepted;
      const available = Array.isArray(availableArr) ? availableArr[0]?.available : (availableArr as any)?.available;
      if (!accepted) {
        throw new Error(`Withdrawal exceeds available amount. Available: ${available}`);
      }

      // 1. Call MeSomb (via helper) withdrawal endpoint with selected service
      const withdrawalResult = await initiateWithdrawal(amount, phoneNumber, {
        message: `Withdrawal from Propella wallet - ${amount.toLocaleString()} FCFA`,
        medium: paymentMethod === 'orange' ? 'orange money' : 'mobile money',
        service: paymentMethod === 'orange' ? 'ORANGE' : 'MTN',
        userId,
      });

      console.log('[useFapshiWithdrawal] Fapshi withdrawal initiated', withdrawalResult);

      const transId = withdrawalResult.transId;

      if (!transId) {
        throw new Error('No transaction ID received from Fapshi');
      }

      // 2. Log withdrawal request in Supabase
      const withdrawalInsert: TablesInsert<'withdrawal_requests'> = {
        user_id: userId,
        amount,
        phone: phoneNumber,
        status: 'pending',
        fapshi_reference: transId,
      };

      console.log('[useFapshiWithdrawal] Creating withdrawal request in database', withdrawalInsert);

      const { data: withdrawalRequest, error: withdrawalError } = await supabase
        .from('withdrawal_requests')
        .insert(withdrawalInsert)
        .select()
        .single();

      if (withdrawalError) {
        console.error('[useFapshiWithdrawal] Database error creating withdrawal request:', withdrawalError);
        throw new Error(`Database error: ${withdrawalError.message}`);
      }

      console.log('[useFapshiWithdrawal] Withdrawal request created in database', withdrawalRequest);

      // 3. Log transaction in Supabase
      const transactionData = {
        user_id: userId,
        amount: -amount, // Negative amount for withdrawal
        type: 'withdrawal',
        property_id: null, // No specific property for withdrawal transactions
        reference: transId,
        status: 'pending',
      };

      console.log('[useFapshiWithdrawal] Creating transaction record', transactionData);

      const { error: transactionError } = await supabase
        .from('transactions')
        .insert(transactionData as any); // Type assertion needed until migration is applied

      if (transactionError) {
        console.error('[useFapshiWithdrawal] Database error creating transaction:', transactionError);
        throw new Error(`Transaction error: ${transactionError.message}`);
      }

      console.log('[useFapshiWithdrawal] Transaction record created successfully');

      // 4. Check immediate status first before starting monitoring
      try {
        console.log('[useFapshiWithdrawal] Checking immediate withdrawal status for transId:', transId);
        // Wait a moment for MeSomb to process the transaction
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
        const immediateStatus = await getWithdrawalStatus(transId);
        console.log('[useFapshiWithdrawal] Immediate withdrawal status received:', {
          status: immediateStatus.status,
          transactionId: immediateStatus.transactionId,
          amount: immediateStatus.amount,
          fullResponse: immediateStatus
        });
        
        if (immediateStatus.status === 'SUCCESSFUL') {
          // Withdrawal completed immediately, no need for monitoring
          console.log('[useFapshiWithdrawal] Withdrawal completed immediately - updating database');
          await updateWithdrawalStatus(transId, withdrawalRequest.id, immediateStatus);
          
          // Update wallet balance (deduct withdrawal amount)
          try {
            const { error: walletError } = await supabase.rpc('update_wallet_balance', {
              user_id: userId,
              amount_to_subtract: amount
            });
              
            if (walletError) {
              console.error('[useFapshiWithdrawal] Failed to update wallet balance:', walletError);
            } else {
              console.log('[useFapshiWithdrawal] Wallet balance updated successfully');
            }
          } catch (walletUpdateError) {
            console.error('[useFapshiWithdrawal] Error updating wallet:', walletUpdateError);
          }
          
          alert('Withdrawal Successful! Your withdrawal has been processed successfully.');
        } else if (immediateStatus.status === 'FAILED' || immediateStatus.status === 'EXPIRED') {
          // Withdrawal failed immediately
          console.log('[useFapshiWithdrawal] Withdrawal failed immediately');
          await updateWithdrawalStatus(transId, withdrawalRequest.id, immediateStatus);
          
          alert('Withdrawal Failed: Your withdrawal could not be processed. Please try again.');
        } else {
          // Status is PENDING/VALIDATING, start monitoring
          console.log('[useFapshiWithdrawal] Withdrawal needs monitoring, status:', immediateStatus.status);
          startWithdrawalMonitoring(transId, withdrawalRequest.id);
        }
      } catch (statusError) {
        console.error('[useFapshiWithdrawal] Error checking immediate status:', statusError);
        // Fallback to monitoring if status check fails
        startWithdrawalMonitoring(transId, withdrawalRequest.id);
      }

      setWithdrawalStatus({
        fapshi: withdrawalResult,
        withdrawalRequest,
      });

      console.log('[useFapshiWithdrawal] Withdrawal process completed successfully');

      return { fapshi: withdrawalResult, withdrawalRequest };
    } catch (err: any) {
      console.error('[useFapshiWithdrawal] Withdrawal process failed:', err);
      const errorMessage = err.message || 'Unknown withdrawal error';
      setError(errorMessage);
      throw new Error(`Withdrawal failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Memoize progress update function to prevent recreation
  const updateProgress = useCallback((progressValue: number, timeValue: number) => {
    try {
      setMonitoringProgress(progressValue);
      setTimeRemaining(timeValue);
    } catch (error) {
      console.error('[useFapshiWithdrawal] Error updating progress:', error);
    }
  }, []);

  // Start automatic withdrawal monitoring
  const startWithdrawalMonitoring = useCallback(async (transId: string, withdrawalRequestId: string) => {
    try {
      setIsMonitoring(true);
      setMonitoringProgress(0);
      setCurrentStatus('PENDING');
      setTimeRemaining(60); // 1 minute for anti-fraud validation

      console.log('[useFapshiWithdrawal] Starting automatic withdrawal monitoring', { transId, withdrawalRequestId });

      // Set up 1-minute timeout for anti-fraud validation
      monitoringRef.current.timeout = setTimeout(async () => {
        console.log('[useFapshiWithdrawal] Withdrawal monitoring timed out after 1 minute');
        
        // Update database with timeout status
        try {
          const { error: updateError } = await supabase
            .from('withdrawal_requests')
            .update({ 
              status: 'processing', // Still processing, not failed
              updated_at: new Date().toISOString()
            })
            .eq('id', withdrawalRequestId);

          if (updateError) {
            console.error('[useFapshiWithdrawal] Failed to update withdrawal request on timeout:', updateError);
          }

          // Keep transaction as pending since we don't know final status
          const { error: transactionError } = await supabase
            .from('transactions')
            .update({ 
              status: 'PENDING', // Still pending validation
              updated_at: new Date().toISOString()
            })
            .eq('reference', transId);

          if (transactionError) {
            console.error('[useFapshiWithdrawal] Failed to update transaction on timeout:', transactionError);
          }
        } catch (error) {
          console.error('[useFapshiWithdrawal] Error updating database on timeout:', error);
        }
        
        stopWithdrawalMonitoring();
        alert('Withdrawal Status Unknown: Unable to confirm withdrawal status. The transaction may have been processed successfully. Please check your mobile money account balance and contact support if needed.');
      }, 60000); // 1 minute

      // Set up progress tracking (0-100% over 1 minute)
      let progress = 0;
      let timeLeft = 60;
      monitoringRef.current.progress = setInterval(() => {
        progress += (100 / 60); // 60 seconds = 1 minute
        timeLeft = Math.max(0, timeLeft - 1);
        
        // Use the memoized function to update state
        updateProgress(Math.min(progress, 100), timeLeft);
      }, 1000);

      // Set up polling interval (check every 5 seconds for faster response)
      monitoringRef.current.interval = setInterval(async () => {
        try {
          console.log('[useFapshiWithdrawal] Checking withdrawal status...');
          
          // Use getPaymentStatus directly instead of pollWithdrawalStatus
          // since we're already polling via the interval
          const status = await getWithdrawalStatus(transId);

          try {
            setCurrentStatus(status.status);
            console.log('[useFapshiWithdrawal] Withdrawal status:', status.status);
          } catch (stateError) {
            console.error('[useFapshiWithdrawal] Error updating status state:', stateError);
          }
          
          // Provide more specific feedback for validation status
          if (status.status === 'PENDING') {
            console.log('[useFapshiWithdrawal] Transaction is being validated by MeSomb (anti-fraud check)');
            
            // Update database periodically even during validation to show it's still active
            const now = new Date().toISOString();
            try {
              await supabase
                .from('withdrawal_requests')
                .update({ updated_at: now } as any)
                .eq('id', withdrawalRequestId);
                
              await supabase
                .from('transactions')
                .update({ updated_at: now } as any)
                .eq('reference', transId);
            } catch (updateError) {
              console.error('[useFapshiWithdrawal] Error updating timestamps:', updateError);
            }
          }

          // Check if we have a final status
          if (status.status === 'SUCCESSFUL' || status.status === 'FAILED' || status.status === 'EXPIRED') {
            console.log('[useFapshiWithdrawal] Final status reached:', status.status);
            
            // Update database
            await updateWithdrawalStatus(transId, withdrawalRequestId, status);
            
            // Stop monitoring
            stopWithdrawalMonitoring();
            
            if (status.status === 'SUCCESSFUL') {
              setMonitoringProgress(100);
              alert('Withdrawal Successful! Your withdrawal has been processed successfully.');
            } else {
              alert(`Withdrawal Failed: Your withdrawal was ${status.status.toLowerCase()}. Please check your account balance to confirm if the funds were received.`);
            }
          }
        } catch (pollError: any) {
          console.error('[useFapshiWithdrawal] Polling error:', pollError);
          // Don't stop monitoring on network errors, just log them
        }
      }, 10000); // Check every 10 seconds

    } catch (error: any) {
      console.error('[useFapshiWithdrawal] Failed to start monitoring:', error);
      stopWithdrawalMonitoring();
    }
  }, [updateProgress]);

  const stopWithdrawalMonitoring = () => {
    console.log('[useFapshiWithdrawal] Stopping withdrawal monitoring');
    
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
    setTimeRemaining(60);
  };

  const updateWithdrawalStatus = async (transId: string, withdrawalRequestId: string, status: any) => {
    try {
      console.log('[useFapshiWithdrawal] Updating withdrawal status in database', { 
        transId, 
        withdrawalRequestId, 
        status 
      });

      // Update withdrawal request with final status
      const { error: updateError } = await supabase
        .from('withdrawal_requests')
        .update({ 
          status: status.status === 'SUCCESSFUL' ? 'completed' : 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', withdrawalRequestId);

      if (updateError) {
        console.error('[useFapshiWithdrawal] Failed to update withdrawal request:', updateError);
      } else {
        console.log('[useFapshiWithdrawal] Withdrawal request status updated successfully');
      }

      // Update transaction with final status (use mapped status)
      const mappedStatus = status.status === 'SUCCESSFUL' ? 'completed' : 
                          status.status === 'FAILED' ? 'failed' : 
                          status.status === 'EXPIRED' ? 'failed' : 'pending';
                          
      const { error: transactionUpdateError } = await supabase
        .from('transactions')
        .update({ 
          status: mappedStatus,
          updated_at: new Date().toISOString()
        })
        .eq('reference', transId);
        
      console.log('[useFapshiWithdrawal] Updating transaction status from', status.status, 'to', mappedStatus);

      if (transactionUpdateError) {
        console.error('[useFapshiWithdrawal] Failed to update transaction:', transactionUpdateError);
      } else {
        console.log('[useFapshiWithdrawal] Transaction status updated successfully');
      }
    } catch (error) {
      console.error('[useFapshiWithdrawal] Error updating withdrawal status:', error);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopWithdrawalMonitoring();
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
    withdrawalStatus,
    isMonitoring,
    monitoringProgress,
    currentStatus,
    timeRemaining: formatTimeRemaining(),
    processFapshiWithdrawal,
    stopWithdrawalMonitoring
  };
} 
