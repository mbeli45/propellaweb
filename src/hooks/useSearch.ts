import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import { PropertyData } from '@/components/PropertyCard';
import debounce from 'lodash/debounce';
import { useBlockedUserIds } from '@/hooks/useModeration';

type Property = Database['public']['Tables']['properties']['Row'];
type SearchFilters = {
  type?: 'rent' | 'sale';
  category?: string[];
  propertyType?: string[];
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  location?: string;
  amenities?: string[];
};

// FilterModal renders display labels ("Apartment", "Single Room", "Budget"),
// but DB columns store canonical lowercase/snake_case values.
const toCanonicalCategory = (label: string) => label.toLowerCase().trim();
const toCanonicalPropertyType = (label: string) =>
  label.toLowerCase().trim().replace(/\s+/g, '_');

export function useSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [results, setResults] = useState<PropertyData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const itemsPerPage = 20;
  const { blockedIds } = useBlockedUserIds();
  const blockedSet = useMemo(() => new Set(blockedIds), [blockedIds]);
  const visibleResults = useMemo(
    () => results.filter((p) => !blockedSet.has((p as any).owner_id)),
    [results, blockedSet],
  );

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((term: string, filters: SearchFilters, page: number) => {
      performSearch(term, filters, page);
    }, 300),
    []
  );

  useEffect(() => {
    debouncedSearch(searchTerm, filters, page);
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchTerm, filters, page]);

  const performSearch = async (term: string, filters: SearchFilters, currentPage: number) => {
    try {
      setLoading(true);
      setError(null);

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
          *,
          profiles!properties_owner_id_fkey (
            id,
            full_name,
            avatar_url,
            email,
            role
          )
        `, { count: 'exact' })
        .eq('status', 'available');

      // Only apply the not-in filter if there are reserved properties
      if (reservedPropertyIds.length > 0) {
        // Use the proper PostgREST syntax for UUID arrays
        const reservedIdsString = reservedPropertyIds.map(id => `"${id}"`).join(',');
        query = query.not('id', 'in', `(${reservedIdsString})`);
      }

      // Apply search term — location can live in either the full address (`location`)
      // or the standalone town field, so match both alongside title/description.
      if (term) {
        const safeTerm = term.replace(/[%,()]/g, '');
        query = query.or(
          `title.ilike.%${safeTerm}%,description.ilike.%${safeTerm}%,location.ilike.%${safeTerm}%,town.ilike.%${safeTerm}%`
        );
      }

      // Apply filters
      if (filters.type) {
        query = query.eq('type', filters.type);
      }
      if (filters.category?.length) {
        query = query.in('category', filters.category.map(toCanonicalCategory));
      }
      if (filters.propertyType?.length) {
        query = query.in('property_type', filters.propertyType.map(toCanonicalPropertyType));
      }
      if (filters.minPrice) {
        query = query.gte('price', filters.minPrice);
      }
      if (filters.maxPrice) {
        query = query.lte('price', filters.maxPrice);
      }
      if (filters.bedrooms) {
        query = query.eq('bedrooms', filters.bedrooms);
      }
      if (filters.bathrooms) {
        query = query.eq('bathrooms', filters.bathrooms);
      }
      if (filters.location) {
        const safeLocation = filters.location.replace(/[%,()]/g, '');
        query = query.or(
          `location.ilike.%${safeLocation}%,town.ilike.%${safeLocation}%`
        );
      }
      if (filters.amenities?.length) {
        query = query.contains('amenities', filters.amenities);
      }

      // Apply pagination
      const start = (currentPage - 1) * itemsPerPage;
      query = query
        .range(start, start + itemsPerPage - 1)
        .order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      // Transform the data to match PropertyData interface
      const transformedResults: PropertyData[] = (data || []).map(property => ({
        id: property.id,
        title: property.title,
        price: property.price,
        location: property.location,
        image: property.images && property.images.length > 0 
          ? property.images[0] 
          : 'https://via.placeholder.com/400x300?text=No+Image',
        type: property.type as 'rent' | 'sale',
        bedrooms: property.bedrooms ?? undefined,
        bathrooms: property.bathrooms ?? undefined,
        area: property.area ?? undefined,
        category: property.category as 'budget' | 'standard' | 'premium' | 'luxury',
        isVerified: property.profiles?.role === 'agent' || property.profiles?.role === 'landlord',
        description: property.description,
        amenities: property.amenities || [],
        reservationFee: property.reservation_fee ?? undefined,
        rent_period: property.rent_period ?? null,
        advance_months_min: property.advance_months_min ?? undefined,
        advance_months_max: property.advance_months_max ?? undefined,
        status: property.status ?? undefined,
        owner_id: property.owner_id,
        owner: property.profiles ? {
          id: property.profiles.id,
          full_name: property.profiles.full_name,
          avatar_url: property.profiles.avatar_url ?? undefined,
          email: property.profiles.email,
          role: property.profiles.role,
        } : undefined,
      }));

      setResults(currentPage === 1 ? transformedResults : [...results, ...transformedResults]);
      setTotalCount(count || 0);
      setHasMore((count || 0) > start + itemsPerPage);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const search = (term: string) => {
    setSearchTerm(term);
    setPage(1);
    setResults([]);
  };

  const updateFilters = (newFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(1);
    setResults([]);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setFilters({});
    setPage(1);
    setResults([]);
  };

  return {
    searchTerm,
    filters,
    results: visibleResults,
    loading,
    error,
    totalCount,
    hasMore,
    search,
    updateFilters,
    loadMore,
    clearSearch,
  };
}
