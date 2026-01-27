import { useState, useCallback, useRef } from 'react';


// Mapbox geocoding API endpoint
const MAPBOX_GEOCODING_URL = 'https://api.mapbox.com/geocoding/v5/mapbox.places';

interface GeocodingResult {
  coordinates: [number, number];
  place_name: string;
  relevance: number;
}

interface GeocodingResponse {
  features: Array<{
    center: [number, number];
    place_name: string;
    relevance: number;
  }>;
}

export function useGeocoding() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Cache for geocoding results to avoid repeated API calls
  const geocodingCache = useRef<Map<string, [number, number]>>(new Map());

  const geocodeLocation = useCallback(async (locationName: string): Promise<[number, number] | null> => {
    if (!locationName || locationName.trim() === '') {
      return null;
    }

    // Check cache first
    const cached = geocodingCache.current.get(locationName);
    if (cached) {
      console.log(`Using cached coordinates for "${locationName}":`, cached);
      return cached;
    }
    if (!locationName || locationName.trim() === '') {
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      // Get Mapbox access token from environment variables
      const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_PUBLIC_MAPBOX_ACCESS_TOKEN;
      
      if (!MAPBOX_ACCESS_TOKEN) {
        console.warn('Mapbox access token not configured. Please set VITE_PUBLIC_MAPBOX_ACCESS_TOKEN in your environment.');
        return null;
      }
      
      // Add Southwest Cameroon context to improve search results
      // Bias towards Southwest region coordinates: Buea [9.2348, 4.1561]
      const searchQuery = `${locationName}, Southwest, Cameroon`;
      const encodedQuery = encodeURIComponent(searchQuery);
      
      // Add proximity parameter to bias results towards Southwest Cameroon (Buea area)
      const url = `${MAPBOX_GEOCODING_URL}/${encodedQuery}.json?access_token=${MAPBOX_ACCESS_TOKEN}&country=CM&proximity=9.2348,4.1561&limit=5&types=place,locality,neighborhood,address`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.status}`);
      }

      const data: GeocodingResponse = await response.json();
      
      if (data.features && data.features.length > 0) {
        // Log all results for debugging
        console.log(`Geocoding results for "${locationName}":`, data.features.map(f => ({
          place: f.place_name,
          coords: f.center,
          relevance: f.relevance
        })));
        
        // Find the best match that is in Southwest Cameroon
        // Southwest region roughly: lng 8.5-10.5, lat 3.8-5.5
        const southwestMatch = data.features.find(f => {
          const [lng, lat] = f.center;
          return lng >= 8.5 && lng <= 10.5 && lat >= 3.8 && lat <= 5.5;
        });
        
        const bestMatch = southwestMatch || data.features[0];
        console.log(`✓ Geocoded "${locationName}" to: [${bestMatch.center[0].toFixed(4)}, ${bestMatch.center[1].toFixed(4)}] - ${bestMatch.place_name}`);
        
        // Cache the result
        geocodingCache.current.set(locationName, bestMatch.center);
        
        return bestMatch.center;
      } else {
        console.warn(`⚠ No geocoding results found for: "${locationName}"`);
        return null;
      }
    } catch (err: any) {
      console.error('Geocoding error:', err);
      setError(err.message || 'Failed to geocode location');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const geocodeMultipleLocations = useCallback(async (locations: string[]): Promise<Map<string, [number, number]>> => {
    const results = new Map<string, [number, number]>();
    
    for (const location of locations) {
      const coordinates = await geocodeLocation(location);
      if (coordinates) {
        results.set(location, coordinates);
      }
    }
    
    return results;
  }, [geocodeLocation]);

  return {
    geocodeLocation,
    geocodeMultipleLocations,
    loading,
    error,
  };
} 
