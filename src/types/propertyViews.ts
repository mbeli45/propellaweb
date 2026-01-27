// Property View Types
export type ViewSource = 'search' | 'map' | 'direct' | 'share' | 'recommendation' | 'profile';
export type DeviceType = 'mobile' | 'tablet' | 'desktop';
export type Platform = 'ios' | 'android' | 'web';

export interface PropertyView {
  id: string;
  property_id: string;
  viewer_id: string | null;
  source: ViewSource;
  session_id?: string;
  device_type: DeviceType;
  platform: Platform;
  view_duration_seconds?: number;
  created_at: string;
}

export interface PropertyViewStats {
  property_id: string;
  total_views: number;
  unique_viewers: number;
  avg_view_duration?: number;
  views_by_source: { [key in ViewSource]?: number };
  views_by_device: { [key in DeviceType]?: number };
}

export interface PropertyAnalyticsSummary {
  property_id: string;
  owner_id: string;
  view_count: number;
  unique_viewers: number;
  avg_view_duration_seconds?: number;
  last_viewed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface TrackViewParams {
  propertyId: string;
  source: ViewSource;
  sessionId?: string | null;
  deviceType?: DeviceType;
  platform?: Platform;
  viewDurationSeconds?: number;
}

export interface ViewTrackingConfig {
  enableSessionTracking: boolean;
  enableDeviceTracking: boolean;
  enableDurationTracking: boolean;
  enableIpTracking: boolean;
  sessionTimeoutMinutes: number;
}
