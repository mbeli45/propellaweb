import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/supabase'

type Notification = Database['public']['Tables']['notifications']['Row']

export function useNotifications(userId: string) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    fetchNotifications()

    // Subscribe to new notifications from database
    const subscription = supabase
      .channel('notifications_channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, handleNotificationChange)
      .subscribe()

    // Request notification permission for browser notifications
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    return () => {
      subscription.unsubscribe()
    }
  }, [userId])

  const handleNotificationChange = (payload: any) => {
    if (payload.eventType === 'INSERT') {
      setNotifications(prev => [payload.new, ...prev])
      
      // Show browser notification if permission granted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(payload.new.title, {
          body: payload.new.body,
          icon: '/favicon.png',
        })
      }
    } else if (payload.eventType === 'UPDATE') {
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === payload.new.id ? payload.new : notif
        )
      )
    } else if (payload.eventType === 'DELETE') {
      setNotifications(prev =>
        prev.filter(notif => notif.id !== payload.old.id)
      )
    }
  }

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setNotifications(data || [])
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)

      if (error) throw error
    } catch (error: any) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false)

      if (error) throw error
    } catch (error: any) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  return {
    notifications,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refreshNotifications: fetchNotifications,
  }
}
