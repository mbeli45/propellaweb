import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface AgentData {
  id: string;
  full_name: string;
  email: string;
  role: string;
  avatar_url?: string;
  bio?: string;
  phone?: string;
  verified?: boolean;
  is_verified_agent?: boolean;
}

interface AgentReview {
  id: string;
  agent_id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
  user?: {
    id: string;
    full_name?: string;
    avatar_url?: string;
  };
}

interface AgentProperty {
  id: string;
  title: string;
  description?: string;
  price: number;
  location: string;
  town?: string;
  availability_confirmed_at?: string | null;
  type: 'rent' | 'sale';
  category: 'budget' | 'standard' | 'premium' | 'luxury';
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  amenities?: string[];
  images?: string[];
  status?: string;
  reservation_fee?: number;
  owner_id: string;
  created_at: string;
}

interface UseAgentProfileReturn {
  agent: AgentData | null;
  reviews: AgentReview[];
  properties: AgentProperty[];
  averageRating: number | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useAgentProfile(agentId: string): UseAgentProfileReturn {
  const [agent, setAgent] = useState<AgentData | null>(null);
  const [reviews, setReviews] = useState<AgentReview[]>([]);
  const [properties, setProperties] = useState<AgentProperty[]>([]);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgentData = useCallback(async () => {
    if (!agentId) {
      return null;
    }

    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', agentId)
        .single();
        
      if (error) {
        console.error('useAgentProfile: Error fetching agent:', error);
        throw error;
      }
      

      return data;
    } catch (err: any) {
      console.error('useAgentProfile: Error fetching agent:', err);
      throw new Error(err.message || 'Failed to load agent profile');
    }
  }, [agentId]);

  const fetchReviews = useCallback(async () => {
    if (!agentId) return [];
    
    
    try {
      const { data, error } = await supabase
        .from('agent_reviews')
        .select(`
          *,
          user:user_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('useAgentProfile: Error fetching reviews:', error);
        throw error;
      }
      
      return data || [];
    } catch (err: any) {
      console.error('useAgentProfile: Error fetching reviews:', err);
      return [];
    }
  }, [agentId]);

  const fetchProperties = useCallback(async () => {
    if (!agentId) return [];
    
    
    try {
      const { data, error } = await supabase
        .from('properties')
        .select(`
          id, title, description, price, location, town, availability_confirmed_at, type, category,
          bedrooms, bathrooms, area, amenities, images, status,
          reservation_fee, rent_period, advance_months_min, advance_months_max,
          owner_id, created_at
        `)
        .eq('owner_id', agentId)
        .eq('status', 'available')
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (error) {
        console.error('useAgentProfile: Error fetching properties:', error);
        throw error;
      }
      
      return data || [];
    } catch (err: any) {
      console.error('useAgentProfile: Error fetching properties:', err);
      return [];
    }
  }, [agentId]);

  const fetchAllData = useCallback(async () => {
    if (!agentId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Fetch agent data first
      const agentData = await fetchAgentData();
      setAgent(agentData);
      
      // Fetch reviews and properties in parallel
      const [reviewsData, propertiesData] = await Promise.all([
        fetchReviews(),
        fetchProperties()
      ]);

      // Process reviews
      setReviews(reviewsData);
      if (reviewsData.length > 0) {
        const avg = reviewsData.reduce((sum: number, r: AgentReview) => sum + (r.rating || 0), 0) / reviewsData.length;
        setAverageRating(avg);
      } else {
        setAverageRating(null);
      }

      // Process properties
      setProperties(propertiesData);
      
      
    } catch (err: any) {
      console.error('useAgentProfile: Error fetching agent data:', err);
      setError(err.message || 'Failed to load agent data');
    } finally {
      setLoading(false);
    }
  }, [agentId, fetchAgentData, fetchReviews, fetchProperties]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const refetch = useCallback(async () => {
    await fetchAllData();
  }, [agentId, fetchAllData]);

  return {
    agent,
    reviews,
    properties,
    averageRating,
    loading,
    error,
    refetch,
  };
} 
