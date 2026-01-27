import { useState, useEffect, useCallback, useRef } from 'react';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { 
  PropertyView, 
  PropertyViewStats, 
  PropertyAnalyticsSummary,
  TrackViewParams,
  ViewSource,
  DeviceType,
  ViewTrackingConfig
} from '@/types/propertyViews';

const DEFAULT_CONFIG: ViewTrackingConfig = {
  enableSessionTracking: true,
  enableDeviceTracking: true,
  enableDurationTracking: false,
  enableIpTracking: false,
  sessionTimeoutMinutes: 30,
};

export const usePropertyViews = (config: Partial<ViewTrackingConfig> = {}) => {
  const { user } = useAuth();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const viewStartTime = useRef<{ [propertyId: string]: number }>({});
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  // Generate session ID on mount
  useEffect(() => {
    if (mergedConfig.enableSessionTracking) {
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setSessionId(newSessionId);
    }
  }, [mergedConfig.enableSessionTracking]);

  // Get device type
  const getDeviceType = useCallback((): DeviceType => {
    if (true) {
      // Simple detection for web - could be enhanced with screen size
      return 'desktop';
    }
    return 'mobile'; // Default for mobile apps
  }, []);

  // Get platform
  const getPlatform = useCallback((): 'ios' | 'android' | 'web' => {
    if (true) return 'web';
    if (Platform.OS === 'ios') return 'ios';
    return 'android';
  }, []);

  // Track a property view
  const trackView = useCallback(async (params: TrackViewParams) => {
    // Use a more efficient tracking approach - don't block on tracking state
    try {
      const viewData: Partial<PropertyView> = {
        property_id: params.propertyId,
        viewer_id: user?.id || null,
        source: params.source,
        session_id: params.sessionId || sessionId || undefined,
        device_type: params.deviceType || getDeviceType(),
        platform: params.platform || getPlatform(),
        view_duration_seconds: params.viewDurationSeconds,
      };

      // Fire and forget - don't await the result
      supabase
        .from('property_views')
        .insert(viewData)
        .then(({ error }) => {
          if (error) {
            console.error('Error tracking property view:', error);
          }
        })
        .catch((error) => {
          console.error('Error tracking property view:', error);
        });
    } catch (error) {
      console.error('Error tracking property view:', error);
    }
  }, [user?.id, sessionId, getDeviceType, getPlatform]);

  // Start tracking view duration
  const startViewTracking = useCallback((propertyId: string) => {
    if (mergedConfig.enableDurationTracking) {
      viewStartTime.current[propertyId] = Date.now();
    }
  }, [mergedConfig.enableDurationTracking]);

  // End tracking view duration and record view
  const endViewTracking = useCallback(async (propertyId: string, source: ViewSource) => {
    let viewDurationSeconds: number | undefined;
    
    if (mergedConfig.enableDurationTracking && viewStartTime.current[propertyId]) {
      const duration = Math.floor((Date.now() - viewStartTime.current[propertyId]) / 1000);
      viewDurationSeconds = duration > 0 ? duration : undefined;
      delete viewStartTime.current[propertyId];
    }

    await trackView({
      propertyId,
      source,
      sessionId,
      deviceType: getDeviceType(),
      platform: getPlatform(),
      viewDurationSeconds,
    });
  }, [trackView, sessionId, getDeviceType, getPlatform, mergedConfig.enableDurationTracking]);

  // Get property view statistics
  const getPropertyViewStats = useCallback(async (propertyId: string): Promise<PropertyViewStats | null> => {
    try {
      const { data, error } = await supabase
        .rpc('get_property_view_stats', { property_uuid: propertyId });

      if (error) throw error;
      return data?.[0] || null;
    } catch (error) {
      console.error('Error fetching property view stats:', error);
      return null;
    }
  }, []);

  // Get agent's total property views
  const getAgentTotalViews = useCallback(async (agentId: string): Promise<number> => {
    try {
      const { data, error } = await supabase
        .rpc('get_agent_total_views', { agent_uuid: agentId });

      if (error) throw error;
      return data || 0;
    } catch (error) {
      console.error('Error fetching agent total views:', error);
      return 0;
    }
  }, []);

  // Get property analytics summary
  const getPropertyAnalyticsSummary = useCallback(async (propertyId: string): Promise<PropertyAnalyticsSummary | null> => {
    try {
      const { data, error } = await supabase
        .from('property_analytics_summary')
        .select('*')
        .eq('property_id', propertyId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching property analytics summary:', error);
      return null;
    }
  }, []);

  // Get agent's property analytics
  const getAgentPropertyAnalytics = useCallback(async (agentId: string): Promise<PropertyAnalyticsSummary[]> => {
    try {
      const { data, error } = await supabase
        .from('property_analytics_summary')
        .select('*')
        .eq('owner_id', agentId)
        .order('view_count', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching agent property analytics:', error);
      return [];
    }
  }, []);

  // Get recent views for a property
  const getRecentPropertyViews = useCallback(async (propertyId: string, limit: number = 10): Promise<PropertyView[]> => {
    try {
      const { data, error } = await supabase
        .from('property_views')
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching recent property views:', error);
      return [];
    }
  }, []);

  // Get user's view history
  const getUserViewHistory = useCallback(async (limit: number = 20): Promise<PropertyView[]> => {
    if (!user?.id) return [];

    try {
      const { data, error } = await supabase
        .from('property_views')
        .select('*')
        .eq('viewer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user view history:', error);
      return [];
    }
  }, [user?.id]);

  return {
    trackView,
    startViewTracking,
    endViewTracking,
    getPropertyViewStats,
    getAgentTotalViews,
    getPropertyAnalyticsSummary,
    getAgentPropertyAnalytics,
    getRecentPropertyViews,
    getUserViewHistory,
    sessionId,
    isTracking,
  };
}; 
