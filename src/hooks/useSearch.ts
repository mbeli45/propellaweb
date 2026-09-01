import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import { PropertyData } from '@/components/PropertyCard';
import debounce from 'lodash/debounce';
import { useBlockedUserIds } from '@/hooks/useModeration';
import { townSearchTerms } from '@/utils/towns';
import { propertyVisibilityFilter } from '@/lib/propertyVisibility';

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

/** `,` `(` `)` and `%` are structural in a PostgREST `or=` list. */
const escapeForOr = (value: string) => value.replace(/[%,()]/g, '');

/**
 * `town.ilike` / `location.ilike` clauses for a place name and every spelling
 * that resolves to it. A listing saved as "Yaounde", or with only its
 * neighbourhood ("Bastos") in the address, still has to surface under the
 * "Yaound\u00e9" chip - matching the raw string alone misses both.
 */
const townClauses = (place: string, alreadyMatched: string[] = []): string[] => {
  const seen = new Set(alreadyMatched.map((value) => value.toLowerCase()));
  const clauses: string[] = [];
  for (const alias of townSearchTerms(place)) {
    const safe = escapeForOr(alias);
    if (!safe || seen.has(safe.toLowerCase())) continue;
    seen.add(safe.toLowerCase());
    clauses.push(`town.ilike.%${safe}%`, `location.ilike.%${safe}%`);
  }
  return clauses;
};

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
  // Highest page already merged into `results`. `loading` is not enough of a
  // guard on its own: performSearch is debounced by 300ms, so it stays false
  // for the whole window after a page bump, and a scroll handler firing every
  // 200ms would walk the counter forward several times - each bump cancelling
  // the request the previous one had queued - so the list never actually grew.
  const fetchedPageRef = useRef(0);
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
        // Available listings, plus any listing the viewer has booked themselves.
        .or(await propertyVisibilityFilter());

      // Apply search term — location can live in either the full address (`location`)
      // or the standalone town field, so match both alongside title/description.
      if (term) {
        const safeTerm = escapeForOr(term);
        query = query.or(
          [
            `title.ilike.%${safeTerm}%`,
            `description.ilike.%${safeTerm}%`,
            `location.ilike.%${safeTerm}%`,
            `town.ilike.%${safeTerm}%`,
            ...townClauses(term, [safeTerm]),
          ].join(',')
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
        const safeLocation = escapeForOr(filters.location);
        query = query.or(
          [
            `location.ilike.%${safeLocation}%`,
            `town.ilike.%${safeLocation}%`,
            ...townClauses(filters.location, [safeLocation]),
          ].join(',')
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
        town: property.town || undefined,
        availability_confirmed_at: property.availability_confirmed_at ?? undefined,
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
        rent_period: (property.rent_period as PropertyData['rent_period']) ?? null,
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

      // Functional update: `performSearch` is reached through a debounced
      // callback frozen at first render, so the `results` it closes over is
      // permanently the initial []. Reading it here made every page past the
      // first replace the list instead of appending to it.
      setResults((prev) =>
        currentPage === 1 ? transformedResults : [...prev, ...transformedResults]
      );
      fetchedPageRef.current = currentPage;
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
    fetchedPageRef.current = 0;
  };

  const updateFilters = (newFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(1);
    setResults([]);
    fetchedPageRef.current = 0;
  };

  const loadMore = () => {
    if (loading || !hasMore) return;
    // A page is already queued or in flight; wait for it to land.
    if (page > fetchedPageRef.current) return;
    setPage(prev => prev + 1);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setFilters({});
    setPage(1);
    setResults([]);
    fetchedPageRef.current = 0;
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
