// Web: Simplified - messages are stored directly in Supabase, no local storage needed
// This file exists for compatibility with hooks that may reference it

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed'

export interface LocalMessage {
  id: string
  content: string
  sender_id: string
  receiver_id: string
  created_at: string
  updated_at: string
  status: MessageStatus
  property_id?: string
  attachment_url?: string
  attachment_type?: string
  reply_to?: string
  is_local: boolean
  server_id?: string
  sync_attempts?: number
}

// Web: Minimal implementation - messages are handled directly via Supabase
class LocalMessageDatabase {
  async init(): Promise<void> {
    // Web: No initialization needed
    return Promise.resolve()
  }

  async addMessage(_message: Omit<LocalMessage, 'updated_at' | 'is_local' | 'sync_attempts'>): Promise<void> {
    // Web: Messages are sent directly to Supabase
    console.warn('addMessage called on web - use Supabase directly')
  }

  async markMessageAsSyncing(_messageId: string): Promise<boolean> {
    return true
  }

  async updateMessageStatus(_messageId: string, _status: MessageStatus, _serverId?: string): Promise<void> {
    // Web: Status updates go directly to Supabase
  }

  async getConversationMessages(_userId1: string, _userId2: string): Promise<LocalMessage[]> {
    // Web: Load messages directly from Supabase
    return []
  }

  async getPendingMessages(): Promise<LocalMessage[]> {
    // Web: No pending messages - all go to Supabase
    return []
  }

  async deleteMessage(_messageId: string): Promise<void> {
    // Web: Delete directly from Supabase
  }

  async clearConversation(_userId1: string, _userId2: string): Promise<void> {
    // Web: Clear directly from Supabase if needed
  }

  async markMessagesAsRead(_receiverId: string, _senderId: string): Promise<void> {
    // Web: Update directly in Supabase
  }

  async syncMessageFromServer(_serverMessage: any): Promise<void> {
    // Web: Messages come directly from Supabase real-time
  }

  async healthCheck(): Promise<{ healthy: boolean; usingFallback: boolean; error?: string }> {
    return { healthy: true, usingFallback: false }
  }
}

export const localMessageDB = new LocalMessageDatabase()
