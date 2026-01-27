import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { useAppState } from './useAppState';

export interface UserPresence {
  userId: string;
  isOnline: boolean;
  lastSeen: Date | null;
  status?: 'online' | 'away' | 'offline';
  typing?: boolean;
}

export const usePresence = (targetUserId?: string) => {
  const { user } = useAuth();
  const { isActive } = useAppState();
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [userPresence, setUserPresence] = useState<UserPresence | null>(null);
  const [isTyping, setIsTyping] = useState<Set<string>>(new Set());
  const [typingChannel, setTypingChannel] = useState<any>(null);

  // Track current user's online status
  const trackPresence = useCallback(async (channel: any) => {
    if (!user?.id) return;

    try {
      // Set user as online
      await channel.track({
        user_id: user.id,
        online_at: new Date().toISOString(),
        last_seen: new Date().toISOString(),
        status: isActive ? 'online' : 'away',
      });
    } catch (error) {
      console.error('Error tracking presence:', error);
    }
  }, [user?.id, isActive]);

  // Update last seen when user becomes inactive
  const updateLastSeen = useCallback(async () => {
    if (!user?.id) return;

    try {
      await supabase
        .from('profiles')
        .update({ 
          last_seen: new Date().toISOString() 
        })
        .eq('id', user.id);
    } catch (error) {
      console.error('Error updating last seen:', error);
    }
  }, [user?.id]);

  // Set up presence tracking
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase.channel('presence');

    // Listen for presence changes
    channel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState();
        const onlineUserIds = Object.keys(presenceState);
        setOnlineUsers(new Set(onlineUserIds));
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        setOnlineUsers(prev => new Set([...prev, key]));
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(key);
          return newSet;
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && isActive) {
          await trackPresence(channel);
        }
      });

    return () => {
      updateLastSeen();
      supabase.removeChannel(channel);
    };
  }, [user?.id, isActive, trackPresence, updateLastSeen]);

  // Update last seen when app becomes inactive
  useEffect(() => {
    if (!isActive) {
      updateLastSeen();
    }
  }, [isActive, updateLastSeen]);

  // Get specific user's presence
  useEffect(() => {
    if (!targetUserId) {
      setUserPresence(null);
      return;
    }

    const fetchUserPresence = async () => {
      try {
        // Get user's last seen from profiles table
        const { data: profile } = await supabase
          .from('profiles')
          .select('last_seen')
          .eq('id', targetUserId)
          .single();

        const isOnline = onlineUsers.has(targetUserId);
        const lastSeen = profile?.last_seen ? new Date(profile.last_seen) : null;

        setUserPresence({
          userId: targetUserId,
          isOnline,
          lastSeen,
          status: isOnline ? 'online' : 'offline',
        });
      } catch (error) {
        console.error('Error fetching user presence:', error);
      }
    };

    fetchUserPresence();
  }, [targetUserId, onlineUsers]);

  // Typing indicators
  const startTyping = useCallback(async (conversationId: string) => {
    if (!user?.id || !typingChannel) return;

    try {
      await typingChannel.track({
        user_id: user.id,
        typing: true,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error starting typing indicator:', error);
    }
  }, [user?.id, typingChannel]);

  const stopTyping = useCallback(async (conversationId: string) => {
    if (!user?.id || !typingChannel) return;

    try {
      await typingChannel.track({
        user_id: user.id,
        typing: false,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error stopping typing indicator:', error);
    }
  }, [user?.id, typingChannel]);

  // Listen for typing indicators
  useEffect(() => {
    if (!user?.id || !targetUserId) return;

    const conversationId = [user.id, targetUserId].sort().join('_');
    const channel = supabase.channel(`typing:${conversationId}`);

    channel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState();
        const typingUsers = Object.values(presenceState)
          .flat()
          .filter((presence: any) => presence.typing && presence.user_id !== user.id)
          .map((presence: any) => presence.user_id);
        
        setIsTyping(new Set(typingUsers));
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setTypingChannel(channel);
        }
      });

    return () => {
      setTypingChannel(null);
      supabase.removeChannel(channel);
    };
  }, [user?.id, targetUserId]);

  return {
    // Current user's online status
    isOnline: onlineUsers.has(user?.id || ''),
    
    // Target user's presence
    userPresence,
    isTargetOnline: userPresence?.isOnline || false,
    targetLastSeen: userPresence?.lastSeen,
    
    // Typing indicators
    isTyping: isTyping.has(targetUserId || ''),
    startTyping,
    stopTyping,
    
    // All online users
    onlineUsers: Array.from(onlineUsers),
    
    // Utility functions
    trackPresence,
    updateLastSeen,
  };
}; 
