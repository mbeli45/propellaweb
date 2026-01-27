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
  console.log('🔄 Navigation state cleared');
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
  type: 'chat' | 'reservation' | 'property';
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
  console.log('🔔 Navigating from notification to:', url);
  
  // Prevent duplicate navigations within a short time window
  const now = Date.now();
  if (lastNavigationUrl === url && now - lastNavigationTime < 2000) {
    console.log('⚠️ Preventing duplicate navigation to:', url);
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
      console.log('📱 Setting up navigation stack with messages route:', messagesRoute);
      
      // Use push instead of replace to maintain proper navigation stack
      router.push(messagesRoute);
      // Use requestAnimationFrame for more reliable timing
      requestAnimationFrame(() => {
        router.push(url);
      });
    } else {
      // For property/reservation notifications, navigate directly without intermediate steps
      // This prevents random navigation issues
      console.log('🏠 Direct navigation to:', url);
      router.push(url);
    }
  } catch (error) {
    console.log('⚠️ Fallback navigation:', error);
    router.push(url);
  }
}

/**
 * Handles navigation based on notification data
 */
export function handleNotificationNavigation(data: NotificationData, currentUserId?: string, userRole?: string) {
  console.log('🔔 Handling notification navigation:', data);

  try {
    switch (data.type) {
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
        console.log('⚠️ Unknown notification type:', data.type);
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
    console.log('⚠️ Missing messageId or senderId for chat notification');
    return;
  }

  console.log('📨 Navigating to chat for message:', data.messageId);

  if (data.propertyId) {
    // Property-based chat - navigate directly to chat with the sender
    const chatParams = new URLSearchParams();
    if (data.propertyId) chatParams.set('propertyId', data.propertyId);
    if (data.messageId) chatParams.set('messageId', data.messageId);
    
    const chatUrl = `/chat/${data.senderId}${chatParams.toString() ? '?' + chatParams.toString() : ''}`;
    console.log('🏠 Navigating to property chat with sender:', chatUrl);
    navigateFromNotification(chatUrl, 'chat', userRole);
  } else {
    // Direct message chat - navigate to chat with the sender
    const chatParams = new URLSearchParams();
    if (data.messageId) chatParams.set('messageId', data.messageId);
    
    const chatUrl = `/chat/${data.senderId}${chatParams.toString() ? '?' + chatParams.toString() : ''}`;
    console.log('💬 Navigating to direct chat with sender:', chatUrl);
    navigateFromNotification(chatUrl, 'chat', userRole);
  }
}

/**
 * Handle reservation notification navigation
 */
function handleReservationNotification(data: NotificationData) {
  if (!data.propertyId) {
    console.log('⚠️ Missing propertyId for reservation notification');
    return;
  }

  console.log('📅 Navigating to property details for reservation:', data.propertyId);
  
  // Navigate to property details screen with reservation context
  const propertyParams = new URLSearchParams();
  if (data.reservationId) propertyParams.set('reservationId', data.reservationId);
  if (data.userId) propertyParams.set('userId', data.userId);
  
  const propertyUrl = `/property/${data.propertyId}${propertyParams.toString() ? '?' + propertyParams.toString() : ''}`;
  console.log('🏠 Navigating to property details with reservation:', propertyUrl);
  navigateFromNotification(propertyUrl, 'reservation');
}

/**
 * Handle property notification navigation
 */
function handlePropertyNotification(data: NotificationData) {
  if (!data.propertyId) {
    console.log('⚠️ Missing propertyId for property notification');
    return;
  }

  console.log('🏠 Navigating to property details:', data.propertyId);
  navigateFromNotification(`/property/${data.propertyId}`, 'property');
}

/**
 * Extract notification data from Expo notification response
 */
export function extractNotificationData(response: Notifications.NotificationResponse): NotificationData | null {
  const data = response.notification.request.content.data;
  
  if (!data || typeof data !== 'object') {
    console.log('⚠️ No valid data in notification response');
    return null;
  }

  // Validate that required fields exist
  if (!data.type) {
    console.log('⚠️ Missing required type field in notification data');
    return null;
  }

  return data as unknown as NotificationData;
}

/**
 * Handle notification response (when user taps notification)
 */
export function handleNotificationResponse(response: Notifications.NotificationResponse, currentUserId?: string, userRole?: string) {
  console.log('🔔 Notification response received');
  
  const data = extractNotificationData(response);
  if (data) {
    handleNotificationNavigation(data, currentUserId, userRole);
  }
}
