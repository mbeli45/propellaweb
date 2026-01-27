import { supabase } from './supabase'

// Web: Simplified notification handling using browser Notification API

export async function requestWebNotificationPermission() {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }
  return false
}

export function sendWebNotification(title: string, body: string, data = {}) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { 
      body,
      data,
      icon: '/icon.png'
    })
  }
}

export async function registerForPushNotifications() {
  try {
    const hasPermission = await requestWebNotificationPermission()
    if (hasPermission) {
      console.log('Web notification permission granted')
      return 'web-notification-token'
    }
    return null
  } catch (error) {
    console.error('Error registering for push notifications:', error)
    throw error
  }
}

export async function sendPushNotification(userId: string, title: string, body: string, data = {}) {
  try {
    // Send browser notification
    sendWebNotification(title, body, data)
    
    // Store notification in database
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        body,
        data,
        type: 'system'
      })

    if (error) throw error
  } catch (error) {
    console.error('Error sending push notification:', error)
    throw error
  }
}

// Web: Notification listeners are handled by browser
export function setupNotificationListeners(
  _onNotificationReceived: (notification: any) => void,
  _onNotificationResponse: (response: any) => void
) {
  // Browser handles notifications automatically
  return () => {
    // Cleanup if needed
  }
}
