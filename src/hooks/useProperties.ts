import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { PropertyData } from '@/components/PropertyCard';

interface FilterOptions {
  category?: string[];
  type?: 'rent' | 'sale';
  status?: 'available' | 'reserved' | 'sold';
  limit?: number;
}

export function useProperties(userId: string) {
  const [properties, setProperties] = useState<PropertyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProperties = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('properties')
        .select(`
          id,
          title,
          description,
          price,
          location,
          type,
          property_type,
          category,
          bedrooms,
          bathrooms,
          area,
          amenities,
          images,
          status,
          reservation_fee,
          rent_period,
          advance_months_min,
          advance_months_max,
          owner_id,
          created_at,
          profiles:owner_id (
            id,
            full_name,
            avatar_url,
            email,
            role
          )
        `)
        .eq('owner_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch active reservations for these properties to derive reserved state
      const propertyIds = (data || []).map((p: any) => p.id);
      let reservedPropertyIdSet = new Set<string>();
      if (propertyIds.length > 0) {
        const { data: reservationsData, error: reservationsError } = await supabase
          .from('reservations')
          .select('property_id')
          .in('status', ['confirmed', 'pending'])
          .in('property_id', propertyIds);
        if (reservationsError) throw reservationsError;
        reservedPropertyIdSet = new Set((reservationsData || []).map((r: any) => r.property_id));
      }

      const transformedProperties: PropertyData[] = data.map((property: any) => ({
        id: property.id,
        title: property.title,
        description: property.description || undefined,
        price: property.price,
        location: property.location,
        type: property.type as 'rent' | 'sale',
        property_type: property.property_type || undefined,
        category: property.category as 'budget' | 'standard' | 'premium' | 'luxury',
        bedrooms: property.bedrooms || undefined,
        bathrooms: property.bathrooms || undefined,
        area: property.area || undefined,
        amenities: property.amenities || [],
        image: property.images?.[0] || 'https://via.placeholder.com/400x300?text=No+Image',
        images: property.images || [],
        // If there is an active reservation, mark as reserved for owner view
        status: reservedPropertyIdSet.has(property.id) ? 'reserved' : (property.status || undefined),
        reservationFee: property.reservation_fee || undefined,
        rent_period: property.rent_period as 'monthly' | 'yearly' | null | undefined,
        advance_months_min: property.advance_months_min || undefined,
        advance_months_max: property.advance_months_max || undefined,
        isVerified: property.profiles?.role === 'agent' || property.profiles?.role === 'landlord',
        owner_id: property.owner_id,
        owner: property.profiles ? {
          id: property.profiles.id,
          full_name: property.profiles.full_name || undefined,
          avatar_url: property.profiles.avatar_url || undefined,
          email: property.profiles.email || undefined,
          role: property.profiles.role || undefined,
        } : undefined,
      }));

      setProperties(transformedProperties);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const deleteProperty = async (propertyId: string) => {
    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId)
        .eq('owner_id', userId); // Ensure user can only delete their own properties

      if (error) throw error;

      // Remove from local state
      setProperties(prev => prev.filter(p => p.id !== propertyId));
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  const refetch = () => {
    fetchProperties();
  };

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  return { properties, loading, error, deleteProperty, refetch };
}

export function useAllProperties(filters?: FilterOptions) {
  const [properties, setProperties] = useState<PropertyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extract individual values to use as dependencies
  const category = filters?.category;
  const type = filters?.type;
  const status = filters?.status;
  const limit = filters?.limit;

  // Create stable string representation of category array
  const categoryString = useMemo(() => 
    category ? JSON.stringify([...category].sort()) : '', 
    [category]
  );

  // Create a cache key for memoization
  const cacheKey = useMemo(() => {
    return JSON.stringify({
      category: categoryString,
      type,
      status,
      limit
    });
  }, [categoryString, type, status, limit]);

  const fetchAllProperties = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // First, get all reserved property IDs
      const reservedResult = await supabase
        .from('reservations')
        .select('property_id')
        .in('status', ['confirmed', 'pending']);

      if (reservedResult.error) {
        throw reservedResult.error;
      }

      const reservedPropertyIds = reservedResult.data?.map(r => r.property_id) || [];

      let query = supabase
        .from('properties')
        .select(`
          id,
          title,
          description,
          price,
          location,
          type,
          category,
          bedrooms,
          bathrooms,
          area,
          amenities,
          images,
          status,
          reservation_fee,
          rent_period,
          advance_months_min,
          advance_months_max,
          owner_id,
          created_at,
          profiles:owner_id (
            id,
            full_name,
            avatar_url,
            email,
            role
          )
        `)
        .eq('status', 'available')
        .order('created_at', { ascending: false });

      // Only apply the not-in filter if there are reserved properties
      if (reservedPropertyIds.length > 0) {
        // Use the proper PostgREST syntax for UUID arrays
        const reservedIdsString = reservedPropertyIds.map(id => `"${id}"`).join(',');
        query = query.not('id', 'in', `(${reservedIdsString})`);
      }

      // Apply filters using the individual values
      if (category && category.length > 0) {
        query = query.in('category', category);
      }
      if (type) {
        query = query.eq('type', type);
      }
      if (status) {
        query = query.eq('status', status);
      } else {
        // Default to available properties only
        query = query.eq('status', 'available');
      }
      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      const transformedProperties: PropertyData[] = data.map((property: any) => ({
        id: property.id,
        title: property.title,
        description: property.description || undefined,
        price: property.price,
        location: property.location,
        type: property.type as 'rent' | 'sale',
        property_type: property.property_type || undefined,
        category: property.category as 'budget' | 'standard' | 'premium' | 'luxury',
        bedrooms: property.bedrooms || undefined,
        bathrooms: property.bathrooms || undefined,
        area: property.area || undefined,
        amenities: property.amenities || [],
        image: property.images?.[0] || 'https://via.placeholder.com/400x300?text=No+Image',
        images: property.images || [],
        status: property.status || undefined,
        reservationFee: property.reservation_fee || undefined,
        rent_period: property.rent_period as 'monthly' | 'yearly' | null | undefined,
        advance_months_min: property.advance_months_min || undefined,
        advance_months_max: property.advance_months_max || undefined,
        isVerified: property.profiles?.role === 'agent' || property.profiles?.role === 'landlord',
        owner_id: property.owner_id,
        owner: property.profiles ? {
          id: property.profiles.id,
          full_name: property.profiles.full_name || undefined,
          avatar_url: property.profiles.avatar_url || undefined,
          email: property.profiles.email || undefined,
          role: property.profiles.role || undefined,
        } : undefined,
      }));

      setProperties(transformedProperties);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [cacheKey]);

  useEffect(() => {
    fetchAllProperties();
  }, [fetchAllProperties]);

  return { properties, loading, error, refetch: fetchAllProperties };
}

export function useProperty(propertyId: string) {
  const [property, setProperty] = useState<PropertyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<number>(0);

  const fetchProperty = useCallback(async () => {
    if (!propertyId) return;
    
    // Cache for 30 seconds to prevent unnecessary refetches
    const now = Date.now();
    if (property && (now - lastFetched) < 30000) {
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      // Optimize query by selecting only essential fields first
      const { data, error } = await supabase
        .from('properties')
        .select(`
          id,
          title,
          description,
          price,
          location,
          type,
          category,
          bedrooms,
          bathrooms,
          area,
          amenities,
          images,
          status,
          reservation_fee,
          owner_id,
          created_at,
          profiles!inner (
            id,
            full_name,
            avatar_url,
            email,
            role
          )
        `)
        .eq('id', propertyId)
        .single();

      if (error) throw error;

      const transformedProperty: PropertyData = {
        id: data.id,
        title: data.title,
        description: data.description || undefined,
        price: data.price,
        location: data.location,
        type: data.type as 'rent' | 'sale',
        category: data.category as 'budget' | 'standard' | 'premium' | 'luxury',
        bedrooms: data.bedrooms || undefined,
        bathrooms: data.bathrooms || undefined,
        area: data.area || undefined,
        amenities: data.amenities || [],
        image: data.images?.[0] || 'https://via.placeholder.com/400x300?text=No+Image',
        images: data.images || [], // Only use images array
        status: data.status || undefined,
        reservationFee: data.reservation_fee || undefined,
        advance_months_min: data.advance_months_min || undefined,
        advance_months_max: data.advance_months_max || undefined,
        isVerified: data.profiles?.role === 'agent' || data.profiles?.role === 'landlord',
        owner_id: data.owner_id, // Add owner_id for owner check
        owner: data.profiles ? {
          id: data.profiles.id,
          full_name: data.profiles.full_name || undefined,
          avatar_url: data.profiles.avatar_url || undefined,
          email: data.profiles.email || undefined,
          role: data.profiles.role || undefined,
        } : undefined,
      };

      setProperty(transformedProperty);
      setLastFetched(now);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [propertyId, property, lastFetched]);

  useEffect(() => {
    fetchProperty();
  }, [fetchProperty]);

  return { property, loading, error, refetch: fetchProperty };
}

export function useSimilarProperties(currentPropertyId: string, category?: string, type?: 'rent' | 'sale', limit: number = 3) {
  const [properties, setProperties] = useState<PropertyData[]>([]);
  const [loading, setLoading] = useState(false); // Start as false since this is secondary data
  const [error, setError] = useState<string | null>(null);
  const lastFetchedRef = useRef<number>(0);

  const fetchSimilarProperties = useCallback(async () => {
    // Check if we have all required parameters before fetching
    if (!currentPropertyId || !category || !type) {
      setProperties([]);
      return;
    }
    
    // Cache for 60 seconds since similar properties don't change frequently
    const now = Date.now();
    if (properties.length > 0 && (now - lastFetchedRef.current) < 60000) {
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      // First, get all reserved property IDs
      const reservedResult = await supabase
        .from('reservations')
        .select('property_id')
        .in('status', ['confirmed', 'pending']);

      if (reservedResult.error) {
        throw reservedResult.error;
      }

      const reservedPropertyIds = reservedResult.data?.map(r => r.property_id) || [];

      // Optimize query by selecting only essential fields and using better indexing
      let query = supabase
        .from('properties')
        .select(`
          id,
          title,
          price,
          location,
          type,
          category,
          bedrooms,
          bathrooms,
          area,
          images,
          status,
          owner_id,
          profiles!inner (
            id,
            full_name,
            avatar_url,
            role
          )
        `)
        .neq('id', currentPropertyId) // Exclude current property
        .eq('status', 'available')
        .eq('category', category)
        .eq('type', type)
        .limit(limit)
        .order('created_at', { ascending: false }); // Most recent first

      // Only apply the not-in filter if there are reserved properties
      if (reservedPropertyIds.length > 0) {
        // Use the proper PostgREST syntax for UUID arrays
        const reservedIdsString = reservedPropertyIds.map(id => `"${id}"`).join(',');
        query = query.not('id', 'in', `(${reservedIdsString})`);
      }

      const { data, error } = await query;

      if (error) throw error;

      const transformedProperties: PropertyData[] = data.map((property: any) => ({
        id: property.id,
        title: property.title,
        description: undefined, // Skip description for similar properties to reduce payload
        price: property.price,
        location: property.location,
        type: property.type as 'rent' | 'sale',
        category: property.category as 'budget' | 'standard' | 'premium' | 'luxury',
        bedrooms: property.bedrooms || undefined,
        bathrooms: property.bathrooms || undefined,
        area: property.area || undefined,
        amenities: [], // Skip amenities for similar properties
        image: property.images?.[0] || 'https://via.placeholder.com/400x300?text=No+Image',
        images: property.images || [],
        status: property.status || undefined,
        reservationFee: undefined, // Skip for similar properties
        advance_months_min: property.advance_months_min || undefined,
        advance_months_max: property.advance_months_max || undefined,
        isVerified: property.profiles?.role === 'agent' || property.profiles?.role === 'landlord',
        owner_id: property.owner_id,
        owner: property.profiles ? {
          id: property.profiles.id,
          full_name: property.profiles.full_name || undefined,
          avatar_url: property.profiles.avatar_url || undefined,
          email: undefined, // Skip email for similar properties
          role: property.profiles.role || undefined,
        } : undefined,
      }));

      setProperties(transformedProperties);
      lastFetchedRef.current = now;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentPropertyId, category, type, limit]);

  // Always call useEffect, but check conditions inside
  useEffect(() => {
    fetchSimilarProperties();
  }, [fetchSimilarProperties]);

  return { properties, loading, error, refetch: fetchSimilarProperties };
}

export function useHomeProperties() {
  const [featuredProperties, setFeaturedProperties] = useState<PropertyData[]>([]);
  const [recentProperties, setRecentProperties] = useState<PropertyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Add cache to prevent unnecessary refetches
  const cacheRef = useRef<{
    data: PropertyData[];
    timestamp: number;
  } | null>(null);
  const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

  const fetchHomeProperties = useCallback(async (forceRefresh = false) => {
    // Check cache first
    if (!forceRefresh && cacheRef.current && 
        Date.now() - cacheRef.current.timestamp < CACHE_DURATION) {
      const cached = cacheRef.current.data;
      const featured = cached.filter(p => 
        p.category === 'premium' || p.category === 'luxury'
      ).slice(0, 5);
      const recent = cached.slice(0, 10);
      
      setFeaturedProperties(featured);
      setRecentProperties(recent);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // First, get all reserved property IDs
      const reservedResult = await supabase
        .from('reservations')
        .select('property_id')
        .in('status', ['confirmed', 'pending']);

      if (reservedResult.error) {
        throw reservedResult.error;
      }

      const reservedPropertyIds = reservedResult.data?.map(r => r.property_id) || [];

      // OPTIMIZATION: Use separate queries for better performance
      // Query 1: Featured properties (premium/luxury) - limit to 5
      let featuredQuery = supabase
        .from('properties')
        .select(`
          id,
          title,
          description,
          price,
          location,
          type,
          property_type,
          category,
          bedrooms,
          bathrooms,
          area,
          amenities,
          images,
          status,
          reservation_fee,
          rent_period,
          advance_months_min,
          advance_months_max,
          owner_id,
          created_at,
          profiles:owner_id (
            id,
            full_name,
            avatar_url,
            email,
            role
          )
        `)
        .eq('status', 'available')
        .in('category', ['premium', 'luxury'])
        .order('created_at', { ascending: false })
        .limit(5);

      // Query 2: Recent properties - limit to 10
      let recentQuery = supabase
        .from('properties')
        .select(`
          id,
          title,
          description,
          price,
          location,
          type,
          property_type,
          category,
          bedrooms,
          bathrooms,
          area,
          amenities,
          images,
          status,
          reservation_fee,
          rent_period,
          advance_months_min,
          advance_months_max,
          owner_id,
          created_at,
          profiles:owner_id (
            id,
            full_name,
            avatar_url,
            email,
            role
          )
        `)
        .eq('status', 'available')
        .order('created_at', { ascending: false })
        .limit(10);

      // Only apply the not-in filter if there are reserved properties
      if (reservedPropertyIds.length > 0) {
        // Use the proper PostgREST syntax for UUID arrays
        const reservedIdsString = reservedPropertyIds.map(id => `"${id}"`).join(',');
        featuredQuery = featuredQuery.not('id', 'in', `(${reservedIdsString})`);
        recentQuery = recentQuery.not('id', 'in', `(${reservedIdsString})`);
      }

      // Execute both queries in parallel
      const [featuredResult, recentResult] = await Promise.all([
        featuredQuery,
        recentQuery
      ]);

      if (featuredResult.error) {
        throw featuredResult.error;
      }

      if (recentResult.error) {
        throw recentResult.error;
      }

      // Transform featured properties
      const transformedFeatured: PropertyData[] = (featuredResult.data || []).map((property: any) => ({
        id: property.id,
        title: property.title,
        description: property.description || undefined,
        price: property.price,
        location: property.location,
        type: property.type as 'rent' | 'sale',
        property_type: property.property_type || undefined,
        category: property.category as 'budget' | 'standard' | 'premium' | 'luxury',
        bedrooms: property.bedrooms || undefined,
        bathrooms: property.bathrooms || undefined,
        area: property.area || undefined,
        amenities: property.amenities || [],
        image: property.images?.[0] || 'https://via.placeholder.com/400x300?text=No+Image',
        images: property.images || [],
        status: property.status || undefined,
        reservationFee: property.reservation_fee || undefined,
        rent_period: property.rent_period as 'monthly' | 'yearly' | null | undefined,
        advance_months_min: property.advance_months_min || undefined,
        advance_months_max: property.advance_months_max || undefined,
        isVerified: property.profiles?.role === 'agent' || property.profiles?.role === 'landlord',
        owner_id: property.owner_id,
        owner: property.profiles ? {
          id: property.profiles.id,
          full_name: property.profiles.full_name || undefined,
          avatar_url: property.profiles.avatar_url || undefined,
          email: property.profiles.email || undefined,
          role: property.profiles.role || undefined,
        } : undefined,
      }));

      // Transform recent properties
      const transformedRecent: PropertyData[] = (recentResult.data || []).map((property: any) => ({
        id: property.id,
        title: property.title,
        description: property.description || undefined,
        price: property.price,
        location: property.location,
        type: property.type as 'rent' | 'sale',
        property_type: property.property_type || undefined,
        category: property.category as 'budget' | 'standard' | 'premium' | 'luxury',
        bedrooms: property.bedrooms || undefined,
        bathrooms: property.bathrooms || undefined,
        area: property.area || undefined,
        amenities: property.amenities || [],
        image: property.images?.[0] || 'https://via.placeholder.com/400x300?text=No+Image',
        images: property.images || [],
        status: property.status || undefined,
        reservationFee: property.reservation_fee || undefined,
        rent_period: property.rent_period as 'monthly' | 'yearly' | null | undefined,
        advance_months_min: property.advance_months_min || undefined,
        advance_months_max: property.advance_months_max || undefined,
        isVerified: property.profiles?.role === 'agent' || property.profiles?.role === 'landlord',
        owner_id: property.owner_id,
        owner: property.profiles ? {
          id: property.profiles.id,
          full_name: property.profiles.full_name || undefined,
          avatar_url: property.profiles.avatar_url || undefined,
          email: property.profiles.email || undefined,
          role: property.profiles.role || undefined,
        } : undefined,
      }));

      // Cache the combined results
      const allProperties = [...transformedFeatured, ...transformedRecent];
      cacheRef.current = {
        data: allProperties,
        timestamp: Date.now()
      };

      setFeaturedProperties(transformedFeatured);
      setRecentProperties(transformedRecent);
    } catch (err: any) {
      console.error('❌ Error in fetchHomeProperties:', err);
      setError(err.message || 'Failed to load properties');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHomeProperties();
  }, [fetchHomeProperties]);

  return { 
    featuredProperties, 
    recentProperties, 
    loading, 
    error, 
    refetch: () => fetchHomeProperties(true)
  };
}
