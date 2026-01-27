import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';

type Wallet = Database['public']['Tables']['wallets']['Row'];
type Transaction = Database['public']['Tables']['transactions']['Row'];

export function useWallet(userId: string) {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleWalletChange = useCallback((payload: any) => {
    if (payload.eventType === 'UPDATE') {
      setWallet(payload.new);
    }
  }, []);

  const handleTransactionChange = useCallback((payload: any) => {
    if (payload.eventType === 'INSERT') {
      setTransactions(prev => [payload.new, ...prev]);
    }
  }, []);

  const fetchWallet = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      setWallet(data);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchTransactions = useCallback(async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data);
    } catch (error: any) {
      setError(error.message);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    
    fetchWallet();
    fetchTransactions();

    // Subscribe to wallet changes
    const walletSubscription = supabase
      .channel(`wallet_changes_${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'wallets',
        filter: `user_id=eq.${userId}`,
      }, handleWalletChange)
      .subscribe();

    // Subscribe to transaction changes
    const transactionSubscription = supabase
      .channel(`transaction_changes_${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'transactions',
        filter: `user_id=eq.${userId}`,
      }, handleTransactionChange)
      .subscribe();

    return () => {
      walletSubscription.unsubscribe();
      transactionSubscription.unsubscribe();
    };
  }, [userId, fetchWallet, fetchTransactions, handleWalletChange, handleTransactionChange]);

  const addTransaction = async (
    propertyId: string,
    amount: number,
    type: 'deposit' | 'withdrawal' | 'payment' | 'refund'
  ) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          property_id: propertyId,
          amount,
          type,
          reference: `TXN-${Date.now()}`,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Process withdrawal for landlords/agents
  const processWithdrawal = async (amount: number, phone: string) => {
    try {
      if (!userId) {
        throw new Error('User ID is required for withdrawal');
      }

      setLoading(true);
      
      // Check if user has sufficient balance
      if (!wallet || (wallet.balance || 0) < amount) {
        throw new Error('Insufficient balance for withdrawal');
      }

      // Get the initiateWithdrawal function
      const { initiateWithdrawal } = await import('@/lib/fapshi');
      
      // Initiate the withdrawal via Fapshi
      const { transId } = await initiateWithdrawal(amount, phone, {
        userId,
        message: `Withdrawal from Propella wallet`
      });
      
      // Create a withdrawal transaction record
      const { data: transactionData, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          property_id: null, // No specific property for withdrawal transactions
          amount,
          type: 'withdrawal',
          reference: `WD-${transId}`,
          status: 'SUCCESSFUL',
          created_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (transactionError) throw transactionError;
      
      // Update the wallet balance
      const { error: walletError } = await supabase
        .from('wallets')
        .update({ 
          balance: (wallet.balance || 0) - amount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
        
      if (walletError) throw walletError;
      
      // Refresh wallet and transactions
      await fetchWallet();
      await fetchTransactions();
      
      return { success: true, transId, transaction: transactionData };
    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    wallet,
    transactions,
    loading,
    error,
    addTransaction,
    processWithdrawal,
    refreshWallet: fetchWallet,
    refreshTransactions: fetchTransactions,
  };
}
