import { useState, useCallback, useRef, useEffect } from 'react';


// Mapbox geocoding API endpoint
const MAPBOX_GEOCODING_URL = 'https://api.mapbox.com/geocoding/v5/mapbox.places';

interface LocationSuggestion {
  id: string;
  place_name: string;
  coordinates: [number, number];
  relevance: number;
  type: string;
  context?: string[];
}

interface GeocodingResponse {
  features: Array<{
    id: string;
    center: [number, number];
    place_name: string;
    relevance: number;
    type: string;
    context?: Array<{
      id: string;
      text: string;
    }>;
  }>;
}

export function useLocationSearch() {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Debounce search requests
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Cache for search results to avoid repeated API calls
  const searchCache = useRef<Map<string, LocationSuggestion[]>>(new Map());

  const searchLocations = useCallback(async (query: string): Promise<LocationSuggestion[]> => {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const trimmedQuery = query.trim();
    
    // Check cache first
    const cached = searchCache.current.get(trimmedQuery);
    if (cached) {
      console.log(`Using cached suggestions for "${trimmedQuery}"`);
      return cached;
    }

    setLoading(true);
    setError(null);

    try {
      // Get Mapbox access token from environment variables
      const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_PUBLIC_MAPBOX_ACCESS_TOKEN;
      
      if (!MAPBOX_ACCESS_TOKEN) {
        console.warn('Mapbox access token not configured. Please set VITE_PUBLIC_MAPBOX_ACCESS_TOKEN in your environment.');
        return [];
      }
      
      // Add Cameroon context to improve search results
      const searchQuery = `${trimmedQuery}, Cameroon`;
      const encodedQuery = encodeURIComponent(searchQuery);
      
      const url = `${MAPBOX_GEOCODING_URL}/${encodedQuery}.json?access_token=${MAPBOX_ACCESS_TOKEN}&country=CM&limit=5&types=place,neighborhood,address,poi`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Location search failed: ${response.status}`);
      }

      const data: GeocodingResponse = await response.json();
      
      if (data.features && data.features.length > 0) {
        const suggestions: LocationSuggestion[] = data.features.map(feature => ({
          id: feature.id,
          place_name: feature.place_name,
          coordinates: feature.center,
          relevance: feature.relevance,
          type: feature.type,
          context: feature.context?.map(ctx => ctx.text)
        }));
        
        // Cache the results
        searchCache.current.set(trimmedQuery, suggestions);
        
        console.log(`Found ${suggestions.length} suggestions for "${trimmedQuery}"`);
        return suggestions;
      } else {
        console.log(`No suggestions found for: ${trimmedQuery}`);
        return [];
      }
    } catch (err: any) {
      console.error('Location search error:', err);
      setError(err.message || 'Failed to search locations');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search function
  const debouncedSearch = useCallback((query: string) => {
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(async () => {
      const results = await searchLocations(query);
      setSuggestions(results);
    }, 300); // 300ms delay
  }, [searchLocations]);

  // Handle search query changes
  const handleSearchQueryChange = useCallback((query: string) => {
    setSearchQuery(query);
    
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    
    debouncedSearch(query);
  }, [debouncedSearch]);

  // Clear suggestions
  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setSearchQuery('');
  }, []);

  // Get current location suggestion
  const getCurrentLocationSuggestion = useCallback(async (): Promise<LocationSuggestion | null> => {
    try {
      const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_PUBLIC_MAPBOX_ACCESS_TOKEN;
      
      if (!MAPBOX_ACCESS_TOKEN) {
        console.warn('Mapbox access token not configured. Please set VITE_PUBLIC_MAPBOX_ACCESS_TOKEN in your environment.');
        return null;
      }

      // This would typically be called after getting user's GPS coordinates
      // For now, we'll return a default suggestion for Cameroon
      return {
        id: 'current-location',
        place_name: 'Current Location',
        coordinates: [11.502, 3.848], // Default to Yaoundé, Cameroon
        relevance: 1,
        type: 'current'
      };
    } catch (error) {
      console.error('Error getting current location suggestion:', error);
      return null;
    }
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return {
    suggestions,
    loading,
    error,
    searchQuery,
    handleSearchQueryChange,
    clearSuggestions,
    getCurrentLocationSuggestion,
    searchLocations
  };
} 
