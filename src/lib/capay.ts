import { supabase } from '@/lib/supabase'

export interface CapayPaymentResponse {
  link: string
  transId: string
}

export interface CapayPaymentStatusResponse {
  status: 'CREATED' | 'PENDING' | 'SUCCESSFUL' | 'FAILED' | 'EXPIRED'
  amount: number
  email?: string
  userId?: string
  externalId?: string
  message?: string
  createdAt: string
  updatedAt: string
  transactionId?: string
  reference?: string
}

export interface CapayTransaction {
  id: string
  status: 'CREATED' | 'PENDING' | 'SUCCESSFUL' | 'FAILED' | 'EXPIRED'
  amount: number
  email?: string
  userId?: string
  externalId?: string
  message?: string
  createdAt: string
  updatedAt: string
  transactionId?: string
  reference?: string
}

export interface PollingOptions {
  interval?: number
  maxAttempts?: number
  timeout?: number
}

export const defaultPollingOptions: PollingOptions = {
  interval: 3000,
  maxAttempts: 20,
  timeout: 60000,
}

// Web: All payment operations go through Edge Functions
export const generatePaymentLink = async (
  amount: number,
  options?: {
    email?: string
    redirectUrl?: string
    userId?: string
    externalId?: string
    message?: string
    cardOnly?: boolean
    payer?: string
    service?: 'MTN' | 'ORANGE' | 'EXPRESS_UNION'
    country?: string
    currency?: string
  }
): Promise<CapayPaymentResponse> => {
  try {
    const transId = options?.externalId || `txn_${Date.now()}`
    console.log('[Payment] Payment prepared', { amount, transId, options })
    
    return {
      link: '',
      transId,
    }
  } catch (error: any) {
    console.error('[Payment] generatePaymentLink error:', error)
    throw new Error(error.message || 'Failed to prepare payment')
  }
}

export const openPaymentLink = async (paymentLink: string) => {
  // Web: Not applicable
  return Promise.resolve()
}

export const getPaymentStatus = async (
  transId: string,
  isWithdrawal: boolean = false
): Promise<CapayPaymentStatusResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke('mesomb-status', {
      body: { transId, isWithdrawal },
      headers: {
        'Content-Type': 'application/json',
      }
    })
    if (error) {
      console.error('[Payment] Status check error:', error)
      throw new Error(error.message || 'Failed to get payment status')
    }
    console.log('[Payment] Status response:', data)
    return data as CapayPaymentStatusResponse
  } catch (error: any) {
    console.error('[Payment] getPaymentStatus error:', error)
    throw new Error(error.message || 'Failed to get payment status')
  }
}

export const expirePayment = async (transId: string): Promise<boolean> => {
  // Web: Handled by Edge Function if needed
  return true
}

export const getUserTransactions = async (
  userId: string,
  limit: number = 50
): Promise<CapayTransaction[]> => {
  // Web: Query from database if needed
  return []
}

export const initiateDirectPayment = async (
  amount: number,
  phone: string,
  options?: {
    medium?: 'mobile money' | 'orange money'
    name?: string
    email?: string
    userId?: string
    externalId?: string
    message?: string
    service?: 'MTN' | 'ORANGE' | 'EXPRESS_UNION'
    country?: string
    currency?: string
  }
): Promise<{ transId: string; raw?: any }> => {
  try {
    console.log('[Payment] Initiating direct payment:', { amount, phone, options })
    
    const { data, error } = await supabase.functions.invoke('mesomb-collect', {
      body: {
        amount,
        phone,
        medium: options?.medium,
        name: options?.name,
        email: options?.email,
        userId: options?.userId,
        externalId: options?.externalId,
        message: options?.message,
        service: options?.service,
        country: options?.country || 'CM',
        currency: options?.currency || 'XAF',
      },
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
    if (error) {
      console.error('[Payment] Edge Function error:', error)
      throw new Error(error.message || 'Failed to process payment')
    }
    
    console.log('[Payment] Edge Function response:', data)
    
    const transId = (data as any)?.transId
    if (!transId) {
      throw new Error('No transaction ID from Edge Function')
    }
    
    return { 
      transId,
      raw: (data as any)?.raw 
    }
  } catch (error: any) {
    console.error('[Payment] initiateDirectPayment error:', error)
    throw new Error(error.message || 'Failed to process payment')
  }
}

export const initiateWithdrawal = async (
  amount: number,
  phone: string,
  options?: {
    medium?: 'mobile money' | 'orange money'
    name?: string
    email?: string
    userId?: string
    externalId?: string
    message?: string
    service?: 'MTN' | 'ORANGE' | 'EXPRESS_UNION'
    country?: string
    currency?: string
  }
): Promise<{ transId: string; raw?: any }> => {
  try {
    console.log('[Payment] Initiating withdrawal:', { amount, phone, options })
    
    const { data, error } = await supabase.functions.invoke('mesomb-withdraw', {
      body: {
        amount,
        phone,
        medium: options?.medium,
        name: options?.name,
        email: options?.email,
        userId: options?.userId,
        externalId: options?.externalId,
        message: options?.message,
        service: options?.service,
        country: options?.country || 'CM',
        currency: options?.currency || 'XAF',
      },
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
    if (error) {
      console.error('[Payment] Edge Function error:', error)
      throw new Error(error.message || 'Failed to process withdrawal')
    }
    
    console.log('[Payment] Edge Function response:', data)
    
    const transId = (data as any)?.transId
    if (!transId) {
      throw new Error('No transaction ID from Edge Function')
    }
    
    return { 
      transId,
      raw: (data as any)?.raw 
    }
  } catch (error: any) {
    console.error('[Payment] initiateWithdrawal error:', error)
    throw new Error(error.message || 'Failed to process withdrawal')
  }
}

export const storeTransactionId = async (key: string, transId: string): Promise<void> => {
  try {
    localStorage.setItem(`transaction_${key}`, transId)
  } catch (error: any) {
    console.error('[Payment] storeTransactionId error:', error)
  }
}

export const getStoredTransactionId = async (key: string): Promise<string | null> => {
  try {
    return localStorage.getItem(`transaction_${key}`)
  } catch (error: any) {
    console.error('[Payment] getStoredTransactionId error:', error)
    return null
  }
}

export const pollPaymentStatus = async (
  transId: string,
  options: PollingOptions = defaultPollingOptions
): Promise<CapayPaymentStatusResponse> => {
  const { interval = 3000, maxAttempts = 20, timeout = 60000 } = options
  const startTime = Date.now()
  let attempts = 0

  while (attempts < maxAttempts) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Payment status polling timed out')
    }
    try {
      const status = await getPaymentStatus(transId)
      console.log(`[Payment] Poll attempt ${attempts + 1}:`, status)
      if (
        status.status === 'SUCCESSFUL' ||
        status.status === 'FAILED' ||
        status.status === 'EXPIRED'
      ) {
        return status
      }
      await new Promise((r) => setTimeout(r, interval))
      attempts += 1
    } catch (error) {
      console.error(`[Payment] Poll attempt ${attempts + 1} failed:`, error)
      attempts += 1
      await new Promise((r) => setTimeout(r, interval * 2))
    }
  }

  throw new Error('Payment status polling exceeded maximum attempts')
}

export const getWithdrawalStatus = async (transId: string): Promise<CapayPaymentStatusResponse> => {
  return getPaymentStatus(transId, true)
}

export const pollWithdrawalStatus = async (
  transId: string,
  options: PollingOptions = defaultPollingOptions
): Promise<CapayPaymentStatusResponse> => {
  const { interval = 3000, maxAttempts = 20, timeout = 60000 } = options
  const startTime = Date.now()
  let attempts = 0

  while (attempts < maxAttempts) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Withdrawal status polling timed out')
    }
    try {
      const status = await getWithdrawalStatus(transId)
      console.log(`[Payment] Withdrawal poll attempt ${attempts + 1}:`, status)
      if (
        status.status === 'SUCCESSFUL' ||
        status.status === 'FAILED' ||
        status.status === 'EXPIRED'
      ) {
        return status
      }
      await new Promise((r) => setTimeout(r, interval))
      attempts += 1
    } catch (error) {
      console.error(`[Payment] Withdrawal poll attempt ${attempts + 1} failed:`, error)
      attempts += 1
      await new Promise((r) => setTimeout(r, interval * 2))
    }
  }

  throw new Error('Withdrawal status polling exceeded maximum attempts')
}

export const processRefund = async (
  reservationId: string
): Promise<{ success: boolean; payout?: any; error?: string }> => {
  try {
    console.log('[Payment] Processing refund for reservation:', reservationId)
    
    const { data, error } = await supabase.functions.invoke('process-refund', {
      body: { reservation_id: reservationId },
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
    if (error) {
      console.error('[Payment] Refund error:', error)
      throw new Error(error.message || 'Failed to process refund')
    }
    
    console.log('[Payment] Refund response:', data)
    
    if (!(data as any)?.success) {
      throw new Error((data as any)?.error || 'Refund failed')
    }
    
    return data as { success: boolean; payout?: any }
  } catch (error: any) {
    console.error('[Payment] processRefund error:', error)
    return {
      success: false,
      error: error.message || 'Failed to process refund'
    }
  }
}
