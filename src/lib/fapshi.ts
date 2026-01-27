// Compatibility layer: keep Fapshi API while delegating to Campay implementation
export {
  generatePaymentLink,
  openPaymentLink,
  getPaymentStatus,
  getWithdrawalStatus,
  expirePayment,
  getUserTransactions,
  initiateDirectPayment,
  initiateWithdrawal,
  storeTransactionId,
  getStoredTransactionId,
  pollPaymentStatus,
  pollWithdrawalStatus,
  processRefund,
} from './capay'

export type {
  CapayPaymentResponse as FapshiPaymentResponse,
  CapayPaymentStatusResponse as FapshiPaymentStatusResponse,
  CapayTransaction as FapshiTransaction,
  PollingOptions,
} from './capay'
