import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';

type Message = Database['public']['Tables']['messages']['Row'];

// Extended message type for optimistic UI
type OptimisticMessage = Message & {
  isOptimistic?: boolean;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  tempId?: string;
};

export function useMessages(userId: string) {
  const [messages, setMessages] = useState<OptimisticMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    
    fetchMessages();

    // Subscribe to new messages
    const subscription = supabase
      .channel(`messages_${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `sender_id=eq.${userId}`,
      }, handleMessageChange)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${userId}`,
      }, handleMessageChange)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  const handleMessageChange = (payload: any) => {
    if (payload.eventType === 'INSERT') {
      setMessages(prev => {
        // Check if this is confirming an optimistic message
        const existingOptimisticIndex = prev.findIndex(msg => 
          msg.isOptimistic && 
          msg.sender_id === payload.new.sender_id &&
          msg.receiver_id === payload.new.receiver_id &&
          msg.content === payload.new.content &&
          Math.abs(new Date(msg.created_at || '').getTime() - new Date(payload.new.created_at).getTime()) < 5000
        );
        
        if (existingOptimisticIndex !== -1) {
          // Replace optimistic message with real one
          const newMessages = [...prev];
          newMessages[existingOptimisticIndex] = {
            ...payload.new,
            status: 'sent'
          };
          return newMessages;
        }
        
        // Add new message if not optimistic
        return [{ ...payload.new, status: 'delivered' }, ...prev];
      });
    } else if (payload.eventType === 'UPDATE') {
      setMessages(prev => 
        prev.map(message => 
          message.id === payload.new.id ? { ...payload.new, status: payload.new.read ? 'read' : 'delivered' } : message
        )
      );
    } else if (payload.eventType === 'DELETE') {
      setMessages(prev => 
        prev.filter(message => message.id !== payload.old.id)
      );
    }
  };

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );
      
      const queryPromise = supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(100);

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

      if (error) throw error;
      
      // Always merge server messages with any existing optimistic messages
      setMessages(prev => {
        const optimisticMessages = prev.filter(msg => msg.isOptimistic);
        const serverMessages = data.map((msg: Message) => ({ 
          ...msg, 
          status: msg.read ? 'read' as const : 'delivered' as const 
        }));
        
        // Remove any server messages that might conflict with optimistic ones
        const filteredServerMessages = serverMessages.filter((serverMsg: OptimisticMessage) => 
          !optimisticMessages.some(optMsg => 
            optMsg.content === serverMsg.content &&
            optMsg.sender_id === serverMsg.sender_id &&
            Math.abs(new Date(optMsg.created_at || '').getTime() - new Date(serverMsg.created_at || '').getTime()) < 10000
          )
        );
        
        return [...optimisticMessages, ...filteredServerMessages];
      });
    } catch (error: any) {
      setError(error.message);
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const sendMessage = useCallback(async (receiverId: string, content: string, attachmentUrl?: string, attachmentType?: string, voiceUrl?: string, propertyId?: string) => {
    // Generate a temporary ID for optimistic UI
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create optimistic message
    const optimisticMessage: OptimisticMessage = {
      id: tempId,
      sender_id: userId,
      receiver_id: receiverId,
      content,
      attachment_url: attachmentUrl || null,
      attachment_type: attachmentType || null,
      voice_url: voiceUrl || null,
      property_id: propertyId || null,
      reply_to: null,
      created_at: new Date().toISOString(),
      read: false,
      isOptimistic: true,
      status: 'sending',
      tempId
    };

    // Add optimistic message immediately
    setMessages(prev => [optimisticMessage, ...prev]);

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: userId,
          receiver_id: receiverId,
          content,
          attachment_url: attachmentUrl,
          attachment_type: attachmentType,
          voice_url: voiceUrl,
          property_id: propertyId,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Update the optimistic message with real data
      setMessages(prev => 
        prev.map(msg => 
          msg.tempId === tempId 
            ? { ...data, status: 'sent' as const }
            : msg
        )
      );
      
      return data;
    } catch (error: any) {
      // Mark optimistic message as failed
      setMessages(prev => 
        prev.map(msg => 
          msg.tempId === tempId 
            ? { ...msg, status: 'failed' as const }
            : msg
        )
      );
      
      setError(error.message);
      throw error;
    }
  }, [userId]);

  const markAsRead = useCallback(async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('id', messageId);

      if (error) throw error;
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  }, []);

  const markConversationAsRead = useCallback(async (currentUserId: string, counterpartId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('receiver_id', currentUserId)
        .eq('sender_id', counterpartId)
        .eq('read', false);

      if (error) throw error;
      
      // Update local state instead of fetching
      setMessages(prev => 
        prev.map(msg => 
          msg.receiver_id === currentUserId && msg.sender_id === counterpartId && !msg.read
            ? { ...msg, read: true, status: 'read' as const }
            : msg
        )
      );
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  }, []);

  const retryMessage = useCallback(async (tempId: string) => {
    const failedMessage = messages.find(msg => msg.tempId === tempId && msg.status === 'failed');
    if (!failedMessage) return;

    // Update status to sending
    setMessages(prev => 
      prev.map(msg => 
        msg.tempId === tempId 
          ? { ...msg, status: 'sending' as const }
          : msg
      )
    );

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: failedMessage.sender_id,
          receiver_id: failedMessage.receiver_id,
          content: failedMessage.content,
          attachment_url: failedMessage.attachment_url,
          attachment_type: failedMessage.attachment_type,
          voice_url: failedMessage.voice_url,
          property_id: failedMessage.property_id,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Update the message with real data
      setMessages(prev => 
        prev.map(msg => 
          msg.tempId === tempId 
            ? { ...data, status: 'sent' as const }
            : msg
        )
      );
      
      return data;
    } catch (error: any) {
      // Mark as failed again
      setMessages(prev => 
        prev.map(msg => 
          msg.tempId === tempId 
            ? { ...msg, status: 'failed' as const }
            : msg
        )
        );
      throw error;
    }
  }, [messages]);

  // Get only server messages (no optimistic) for message lists
  const getServerMessages = useCallback(() => {
    return messages.filter(msg => !msg.isOptimistic);
  }, [messages]);

  // Memoize server messages to prevent infinite re-renders
  const serverMessages = useMemo(() => getServerMessages(), [getServerMessages]);

  return {
    messages,
    serverMessages,
    loading,
    error,
    sendMessage,
    markAsRead,
    markConversationAsRead,
    retryMessage,
    refreshMessages: fetchMessages,
  };
}
