// Web compatibility: expo-router and expo-notifications are not available in web builds
// These are stubs for the web version
const router = {
  push: (path: string) => {
    if (typeof window !== 'undefined') {
      window.location.href = path;
    }
  },
  navigate: (path: string) => {
    if (typeof window !== 'undefined') {
      window.location.href = path;
    }
  }
};

const Notifications = {
  getPermissionsAsync: async () => ({ status: 'granted' }),
  requestPermissionsAsync: async () => ({ status: 'granted' }),
};

// Track last navigation to prevent duplicate navigations
let lastNavigationTime = 0;
let lastNavigationUrl = '';

/**
 * Clear navigation state (useful for debugging or resetting)
 */
export function clearNavigationState() {
  lastNavigationTime = 0;
  lastNavigationUrl = '';
}

/**
 * Get current navigation state (for debugging)
 */
export function getNavigationState() {
  return {
    lastNavigationTime,
    lastNavigationUrl,
    timeSinceLastNavigation: Date.now() - lastNavigationTime
  };
}

export interface NotificationData {
  type: 'chat' | 'reservation' | 'property' | 'deal' | 'identity';
  kind?: string;
  identityId?: string;
  dealId?: string;
  messageId?: string;
  senderId?: string;
  receiverId?: string;
  propertyId?: string;
  reservationId?: string;
  userId?: string;
  property?: {
    id: string;
    title: string;
    price?: number;
    location?: string;
  };
}

/**
 * Navigate with proper stack management for notifications
 */
function navigateFromNotification(url: string, notificationType: 'chat' | 'reservation' | 'property', userRole?: string) {
  
  // Prevent duplicate navigations within a short time window
  const now = Date.now();
  if (lastNavigationUrl === url && now - lastNavigationTime < 2000) {
    return;
  }
  
  lastNavigationTime = now;
  lastNavigationUrl = url;
  
  try {
    // Clear any modals first
    router.dismissAll();
    
    // For chat notifications, we want to ensure the user can go back to messages
    if (notificationType === 'chat') {
      // Navigate to the appropriate messages screen first, then to the chat
      // This ensures there's a proper back navigation
      const messagesRoute = (userRole === 'agent' || userRole === 'landlord') ? '/(agent)/messages' : '/(user)/messages';
      
      // Use push instead of replace to maintain proper navigation stack
      router.push(messagesRoute);
      // Use requestAnimationFrame for more reliable timing
      requestAnimationFrame(() => {
        router.push(url);
      });
    } else {
      // For property/reservation notifications, navigate directly without intermediate steps
      // This prevents random navigation issues
      router.push(url);
    }
  } catch (error) {
    router.push(url);
  }
}

/**
 * Handles navigation based on notification data
 */
export function handleNotificationNavigation(data: NotificationData, currentUserId?: string, userRole?: string) {

  try {
    switch (data.type) {
      case 'identity':
        if (data.kind === 'identity_review' && data.identityId) {
          const base = ['admin.propellacam.com', 'admin.propella.cm', 'admin.propella.com'].includes(window.location.hostname) ? '' : '/admin';
          router.push(`${base}/agent_identity_verifications/${encodeURIComponent(data.identityId)}`);
        } else if (data.kind === 'identity_decision') router.push('/agent/identity');
        break;
      case 'deal':
        router.push(userRole === 'agent' || userRole === 'landlord' ? '/agent/deals' : '/user/deals');
        break;
      case 'chat':
        handleChatNotification(data, currentUserId, userRole);
        break;
      
      case 'reservation':
        handleReservationNotification(data);
        break;
      
      case 'property':
        handlePropertyNotification(data);
        break;
      
      default:
        console.warn('Unknown notification type:', data.type);
    }
  } catch (error) {
    console.error('❌ Error handling notification navigation:', error);
  }
}

/**
 * Handle chat notification navigation
 */
function handleChatNotification(data: NotificationData, currentUserId?: string, userRole?: string) {
  if (!data.messageId || !data.senderId) {
    return;
  }


  if (data.propertyId) {
    // Property-based chat - navigate directly to chat with the sender
    const chatParams = new URLSearchParams();
    if (data.propertyId) chatParams.set('propertyId', data.propertyId);
    if (data.messageId) chatParams.set('messageId', data.messageId);
    
    const chatUrl = `/chat/${data.senderId}${chatParams.toString() ? '?' + chatParams.toString() : ''}`;
    navigateFromNotification(chatUrl, 'chat', userRole);
  } else {
    // Direct message chat - navigate to chat with the sender
    const chatParams = new URLSearchParams();
    if (data.messageId) chatParams.set('messageId', data.messageId);
    
    const chatUrl = `/chat/${data.senderId}${chatParams.toString() ? '?' + chatParams.toString() : ''}`;
    navigateFromNotification(chatUrl, 'chat', userRole);
  }
}

/**
 * Handle reservation notification navigation
 */
function handleReservationNotification(data: NotificationData) {
  if (!data.propertyId) {
    return;
  }

  
  // Navigate to property details screen with reservation context
  const propertyParams = new URLSearchParams();
  if (data.reservationId) propertyParams.set('reservationId', data.reservationId);
  if (data.userId) propertyParams.set('userId', data.userId);
  
  const propertyUrl = `/property/${data.propertyId}${propertyParams.toString() ? '?' + propertyParams.toString() : ''}`;
  navigateFromNotification(propertyUrl, 'reservation');
}

/**
 * Handle property notification navigation
 */
function handlePropertyNotification(data: NotificationData) {
  if (!data.propertyId) {
    return;
  }

  navigateFromNotification(`/property/${data.propertyId}`, 'property');
}

/**
 * Extract notification data from Expo notification response
 */
export function extractNotificationData(response: Notifications.NotificationResponse): NotificationData | null {
  const data = response.notification.request.content.data;
  
  if (!data || typeof data !== 'object') {
    return null;
  }

  // Validate that required fields exist
  if (!data.type) {
    return null;
  }

  return data as unknown as NotificationData;
}

/**
 * Handle notification response (when user taps notification)
 */
export function handleNotificationResponse(response: Notifications.NotificationResponse, currentUserId?: string, userRole?: string) {
  
  const data = extractNotificationData(response);
  if (data) {
    handleNotificationNavigation(data, currentUserId, userRole);
  }
}
