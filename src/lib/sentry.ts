import * as Sentry from '@sentry/react';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error && typeof (error as any).message === 'string') {
    return (error as any).message;
  }
  return 'Unknown error';
}

function shouldIgnoreError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('aborterror') ||
    lower.includes('signal is aborted without reason')
  );
}

// Detect iOS device
function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

// Get device info
function getDeviceInfo() {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    vendor: navigator.vendor,
    isIOS: isIOS(),
    isSafari: /^((?!chrome|android).)*safari/i.test(navigator.userAgent),
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio,
  };
}

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  
  if (!dsn) {
    console.warn('Sentry DSN not configured. Error tracking is disabled.');
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE || 'development',
    ignoreErrors: [
      // WKWebView-based in-app browsers (e.g. Facebook iOS) expose window.webkit
      // but may not register the specific handler names third-party libs probe for.
      /window\.webkit\.messageHandlers/,
    ],
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    // Performance Monitoring
    tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,
    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    // Release tracking
    release: import.meta.env.VITE_APP_VERSION,
    beforeSend(event) {
      // Add device context to all events
      const deviceInfo = getDeviceInfo();
      event.contexts = {
        ...event.contexts,
        device: deviceInfo,
      };

      // Tag iOS-specific issues
      if (deviceInfo.isIOS) {
        event.tags = {
          ...event.tags,
          ios: true,
          safari: deviceInfo.isSafari,
        };
      }

      // Filter out development errors if needed
      if (import.meta.env.MODE === 'development') {
        console.log('Sentry Event:', event);
      }
      return event;
    },
  });

  // Set initial device context
  Sentry.setContext('device', getDeviceInfo());
}

// Helper to capture exceptions with context
export function captureException(error: unknown, context?: Record<string, any>) {
  const message = getErrorMessage(error);
  if (shouldIgnoreError(message)) return;

  Sentry.withScope((scope) => {
    if (context) {
      scope.setContext('additional', context);
    }

    if (error instanceof Error) {
      Sentry.captureException(error);
      return;
    }

    // Normalize non-Error values (e.g., PostgREST objects) to avoid noisy
    // "Object captured as exception with keys" events.
    scope.setExtra('raw_error', error as any);
    Sentry.captureException(new Error(message));
  });
}

// Helper to capture messages
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  Sentry.captureMessage(message, level);
}

// Helper to set user context
export function setUser(user: { id: string; email?: string; username?: string } | null) {
  Sentry.setUser(user);
}

// Helper to add breadcrumb
export function addBreadcrumb(breadcrumb: Sentry.Breadcrumb) {
  Sentry.addBreadcrumb(breadcrumb);
}

// Helper specifically for map-related errors
export function captureMapError(error: Error, mapContext?: {
  action?: string;
  coordinates?: { lat: number; lng: number };
  zoom?: number;
  mapProvider?: string;
  [key: string]: any;
}) {
  Sentry.withScope((scope) => {
    scope.setTag('component', 'map');
    scope.setTag('platform', isIOS() ? 'ios' : 'other');
    
    const fullContext = {
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      ...mapContext,
    };
    
    scope.setContext('map', fullContext);
    Sentry.captureException(error);
  });
}

// Helper to track map interactions
export function trackMapInteraction(action: string, data?: Record<string, any>) {
  addBreadcrumb({
    category: 'map',
    message: `Map interaction: ${action}`,
    level: 'info',
    data: {
      ...data,
      isIOS: isIOS(),
      timestamp: new Date().toISOString(),
    },
  });
}
