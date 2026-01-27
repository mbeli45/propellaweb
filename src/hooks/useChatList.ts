import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import { useMessages } from './useMessages';

export interface ConversationSummary {
  counterpart: Database['public']['Tables']['profiles']['Row'];
  lastMessage: Database['public']['Tables']['messages']['Row'];
  unread: boolean;
  // lastMessage.attachment_url, lastMessage.attachment_type, lastMessage.voice_url are available
}

/**
 * Returns a list of conversations (similar to WhatsApp chat list).
 * A conversation is represented by the *other* user's profile, the last message exchanged
 * with them, and whether the last message is unread by the current user.
 */
export function useChatList(currentUserId: string) {
  const {
    serverMessages,
    loading: messagesLoading,
    refreshMessages,
  } = useMessages(currentUserId);

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // derive conversations whenever the underlying message list changes
    if (messagesLoading) return;

    const latestMap: Record<string, Database['public']['Tables']['messages']['Row']> = {};

    serverMessages.forEach((m) => {
      const counterpartId = m.sender_id === currentUserId ? m.receiver_id : m.sender_id;
      const existing = latestMap[counterpartId];
      if (!existing || new Date(m.created_at || '').getTime() > new Date(existing.created_at || '').getTime()) {
        latestMap[counterpartId] = m;
      }
    });

    const counterpartIds = Object.keys(latestMap);
    if (counterpartIds.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    // Fetch counterpart profiles in bulk
    setLoading(true);
    supabase
      .from('profiles')
      .select('*')
      .in('id', counterpartIds)
      .then(({ data, error }) => {
        if (error) {
          setError(error.message);
          setLoading(false);
          return;
        }

        const profileMap = Object.fromEntries(data!.map((p) => [p.id, p]));
        const convos: ConversationSummary[] = counterpartIds.map((id) => {
          const lastMsg = latestMap[id];
          return {
            counterpart: profileMap[id],
            lastMessage: lastMsg,
            unread: !lastMsg.read && lastMsg.receiver_id === currentUserId,
          } as ConversationSummary;
        });

        // sort by latest message timestamp desc
        convos.sort(
          (a, b) =>
            new Date(b.lastMessage.created_at || '').getTime() -
            new Date(a.lastMessage.created_at || '').getTime()
        );

        setConversations(convos);
        setLoading(false);
      });
  }, [serverMessages, messagesLoading, currentUserId]);

  return {
    conversations,
    loading,
    error,
    refresh: () => refreshMessages(),
  };
}
