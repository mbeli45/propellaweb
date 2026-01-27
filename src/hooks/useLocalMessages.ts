import { useState, useEffect, useCallback, useRef } from 'react';
import { localMessageDB, LocalMessage, MessageStatus } from '@/lib/localMessages';
import { useMessages } from './useMessages';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { useNetworkStatus } from './useNetworkStatus';
import { usePresence } from './usePresence';


export const useLocalMessages = (currentUserId: string, counterpartId: string) => {
  const [localMessages, setLocalMessages] = useState<LocalMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSyncingRef = useRef(false);
  const lastSyncRef = useRef(0);

  // Get server messages for sync
  const { messages: serverMessages, sendMessage: serverSendMessage } = useMessages(currentUserId);

  // Monitor network connectivity
  const { isOnline } = useNetworkStatus();

  // Monitor presence and typing indicators
  const { 
    isTargetOnline, 
    targetLastSeen, 
    isTyping, 
    startTyping, 
    stopTyping 
  } = usePresence(counterpartId);

  // Load messages
  const loadLocalMessages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      if (true) {
        // On web: load directly from server
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${counterpartId}),and(sender_id.eq.${counterpartId},receiver_id.eq.${currentUserId})`)
          .order('created_at', { ascending: true });
        if (error) throw error;
        setLocalMessages(
          (data || []).map((row: any) => ({
            id: row.id,
            content: row.content || '',
            sender_id: row.sender_id,
            receiver_id: row.receiver_id,
            created_at: row.created_at,
            updated_at: row.updated_at || row.created_at,
            status: row.read ? 'read' : 'delivered',
            property_id: row.property_id || undefined,
            attachment_url: row.attachment_url || undefined,
            attachment_type: row.attachment_type || undefined,
            reply_to: row.reply_to || undefined,
            is_local: false,
            server_id: row.id,
            sync_attempts: 0,
          }))
        );
      } else {
        const messages = await localMessageDB.getConversationMessages(currentUserId, counterpartId);
        setLocalMessages(messages);
      }
    } catch (err) {
      console.error('Error loading local messages:', err);
      setError('Failed to load messages');
      // Return empty array to prevent crashes
      setLocalMessages([]);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, counterpartId]);

  // Sync local messages with server (only for offline messages)
  const syncWithServer = useCallback(async () => {
    // Only sync if we're online and have pending messages
    if (!isOnline) {
      return;
    }

    // Prevent multiple simultaneous syncs
    if (isSyncingRef.current) {
      return;
    }

    // Debounce sync calls
    const now = Date.now();
    if (now - lastSyncRef.current < 2000) { // Increased debounce time
      return;
    }

    isSyncingRef.current = true;
    lastSyncRef.current = now;

    try {
      // Get pending messages that need to be sent to server
      const pendingMessages = await localMessageDB.getPendingMessages();
      
      for (const message of pendingMessages) {
        if (message.sender_id === currentUserId) {
          // Check if message is already being synced
          const canSync = await localMessageDB.markMessageAsSyncing(message.id);
          if (!canSync) {
            continue; // Skip if already syncing
          }

          try {
            // Update status to sending
            await localMessageDB.updateMessageStatus(message.id, 'sending');
            
            // Send to server
            const serverMessage = await serverSendMessage(
              message.receiver_id,
              message.content,
              message.attachment_url,
              message.attachment_type,
              undefined,
              message.property_id
            );

            // Update local message with server response
            await localMessageDB.updateMessageStatus(
              message.id,
              'sent',
              serverMessage.id
            );
          } catch (err) {
            console.error('Error syncing message:', err);
            try {
              await localMessageDB.updateMessageStatus(message.id, 'failed');
            } catch (updateErr) {
              console.error('Error updating message status:', updateErr);
            }
          }
        }
      }

      // Sync incoming messages from server
      const conversationMessages = serverMessages.filter(msg => 
        (msg.sender_id === currentUserId && msg.receiver_id === counterpartId) ||
        (msg.sender_id === counterpartId && msg.receiver_id === currentUserId)
      );

      for (const serverMessage of conversationMessages) {
        try {
          await localMessageDB.syncMessageFromServer(serverMessage);
        } catch (err) {
          console.error('Error syncing individual message from server:', err);
          // Continue with other messages
        }
      }

      await loadLocalMessages();
    } catch (err) {
      console.error('Error in sync:', err);
      // Don't throw the error to prevent breaking the entire sync process
    } finally {
      isSyncingRef.current = false;
    }
  }, [currentUserId, counterpartId, serverMessages, serverSendMessage, loadLocalMessages, isOnline]);

  // Send a new message - on web: server-only; native: try server first, fallback local
  const sendMessage = useCallback(async (
    content: string,
    attachmentUrl?: string,
    attachmentType?: string,
    propertyId?: string
  ): Promise<LocalMessage> => {
    const messageId = uuidv4();
    const now = new Date().toISOString();
    
    const newMessage: Omit<LocalMessage, 'updated_at' | 'is_local' | 'sync_attempts'> = {
      id: messageId,
      content,
      sender_id: currentUserId,
      receiver_id: counterpartId,
      created_at: now,
      status: 'sending',
      property_id: propertyId,
      attachment_url: attachmentUrl,
      attachment_type: attachmentType,
    };

    // Web: always send to server directly
    if (true) {
      const serverMessage = await serverSendMessage(
        counterpartId,
        content,
        attachmentUrl,
        attachmentType,
        undefined,
        propertyId
      );
      const fullMessage: LocalMessage = {
        ...newMessage,
        updated_at: now,
        is_local: false,
        status: 'sent',
        server_id: serverMessage.id,
        sync_attempts: 0,
      };
      setLocalMessages(prev => [...prev, fullMessage]);
      return fullMessage;
    }

    // Native: Try to send directly to server if online
    if (isOnline) {
      try {
        console.log('Sending message directly to server...');
        
        // Send to server first
        const serverMessage = await serverSendMessage(
          counterpartId,
          content,
          attachmentUrl,
          attachmentType,
          undefined,
          propertyId
        );

        // Create local message with server response
        const fullMessage: LocalMessage = {
          ...newMessage,
          updated_at: now,
          is_local: false,
          status: 'sent',
          server_id: serverMessage.id,
          sync_attempts: 0,
        };

        // Add to local database for persistence
        await localMessageDB.addMessage({
          ...newMessage,
          status: 'sent',
          server_id: serverMessage.id,
        });
        
        // Update local state
        setLocalMessages(prev => [...prev, fullMessage]);

        console.log('✅ Message sent directly to server');
        return fullMessage;
      } catch (serverError) {
        console.warn('Failed to send to server, falling back to local storage:', serverError);
        // Fall through to local storage
      }
    }

    // Native fallback to local storage (offline or server failed)
    try {
      console.log('Storing message locally for later sync...');
      
      // Add to local database
      await localMessageDB.addMessage(newMessage);
      
      // Update local state
      const fullMessage: LocalMessage = {
        ...newMessage,
        updated_at: now,
        is_local: true,
        sync_attempts: 0,
      };
      
      setLocalMessages(prev => [...prev, fullMessage]);

      // Trigger sync after a delay if online
      if (isOnline) {
        if (syncTimeoutRef.current) {
          clearTimeout(syncTimeoutRef.current);
        }
        syncTimeoutRef.current = setTimeout(() => {
          syncWithServer();
        }, 2000); // Increased from 500ms to 2 seconds
      }

      console.log('✅ Message stored locally');
      return fullMessage;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }, [currentUserId, counterpartId, syncWithServer, isOnline, serverSendMessage]);

  // Retry failed messages
  const retryMessage = useCallback(async (messageId: string) => {
    const message = localMessages.find(m => m.id === messageId);
    if (!message || message.status !== 'failed') return;

    try {
      await localMessageDB.updateMessageStatus(messageId, 'sending');
      await loadLocalMessages();
      
      // Trigger sync
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      retryTimeoutRef.current = setTimeout(() => {
        syncWithServer();
      }, 3000); // Increased from 500ms to 3 seconds
    } catch (err) {
      console.error('Error retrying message:', err);
    }
  }, [localMessages, loadLocalMessages, syncWithServer]);

  // Mark messages as read
  const markAsRead = useCallback(async () => {
    try {
      await localMessageDB.markMessagesAsRead(currentUserId, counterpartId);
      await loadLocalMessages();
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  }, [currentUserId, counterpartId, loadLocalMessages]);

  // Delete a message
  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      await localMessageDB.deleteMessage(messageId);
      setLocalMessages(prev => prev.filter(m => m.id !== messageId));
    } catch (err) {
      console.error('Error deleting message:', err);
    }
  }, []);

  // Clear conversation
  const clearConversation = useCallback(async () => {
    try {
      await localMessageDB.clearConversation(currentUserId, counterpartId);
      setLocalMessages([]);
    } catch (err) {
      console.error('Error clearing conversation:', err);
    }
  }, [currentUserId, counterpartId]);

  // Load messages on mount and when dependencies change
  useEffect(() => {
    if (currentUserId && counterpartId) {
      loadLocalMessages();
    }
  }, [loadLocalMessages, currentUserId, counterpartId]);

  // Set up periodic sync with longer interval (only for offline messages)
  useEffect(() => {
    if (!currentUserId || !counterpartId || !isOnline) return;

    const syncInterval = setInterval(syncWithServer, 30000); // Sync every 30 seconds instead of 10

    return () => {
      clearInterval(syncInterval);
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [syncWithServer, currentUserId, counterpartId, isOnline]);

  // Set up real-time subscription for new messages
  useEffect(() => {
    if (!currentUserId || !counterpartId) return;

    const channel = supabase
      .channel(`messages:${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${currentUserId}`,
        },
        async (payload) => {
          const newMessage = payload.new;
          if (newMessage.sender_id === counterpartId) {
            try {
              await localMessageDB.syncMessageFromServer(newMessage);
              await loadLocalMessages();
            } catch (error) {
              console.error('Error handling real-time message insert:', error);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${currentUserId}`,
        },
        async (payload) => {
          const updatedMessage = payload.new;
          if (updatedMessage.sender_id === counterpartId) {
            try {
              await localMessageDB.syncMessageFromServer(updatedMessage);
              await loadLocalMessages();
            } catch (error) {
              console.error('Error handling real-time message update:', error);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, counterpartId, loadLocalMessages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  return {
    messages: localMessages,
    loading,
    error,
    isOnline,
    sendMessage,
    retryMessage,
    markAsRead,
    deleteMessage,
    clearConversation,
    refresh: loadLocalMessages,
    // Presence and typing indicators
    isTargetOnline,
    targetLastSeen,
    isTyping,
    startTyping,
    stopTyping,
  };
};
