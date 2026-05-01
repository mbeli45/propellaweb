import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useThemeMode } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/I18nContext'
import { getColors } from '@/constants/Colors'
import { useAllProperties } from '@/hooks/useProperties'
import { useGeocoding } from '@/hooks/useGeocoding'
import MapView from '@/components/MapView'
import MapPropertyCards from '@/components/MapPropertyCards'

export default function UserMap() {
  const { colorScheme } = useThemeMode()
  const { t } = useLanguage()
  const Colors = getColors(colorScheme)
  const { properties, loading } = useAllProperties()
  const { geocodeLocation } = useGeocoding()
  const navigate = useNavigate()
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [markers, setMarkers] = useState<Array<{
    id: string;
    coordinates: [number, number];
    title?: string;
    description?: string;
    property?: any;
  }>>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeSearch, setActiveSearch] = useState('')

  const displayedProperties = useMemo(() => {
    if (!activeSearch.trim()) return properties
    const q = activeSearch.trim().toLowerCase()
    return properties.filter((p: any) =>
      (p.location || '').toLowerCase().includes(q) ||
      (p.title || '').toLowerCase().includes(q) ||
      (p.town || '').toLowerCase().includes(q)
    )
  }, [properties, activeSearch])

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          console.log('Geolocation error:', error)
        }
      )
    }
  }, [])

  // Geocode properties - only show properties with valid coordinates
  useEffect(() => {
    let isMounted = true;
    (async () => {
      console.log('Starting geocoding for', displayedProperties.length, 'properties');
      const results: Array<{
        id: string;
        coordinates: [number, number];
        title?: string;
        description?: string;
        property?: any;
      }> = [];
      
      for (const p of displayedProperties) {
        if (!isMounted) break;
        
        // Skip properties without location
        if (!p.location || p.location.trim() === '') {
          console.warn('⚠ Property has no location:', p.title);
          continue;
        }
        
        console.log(`🔍 Geocoding property "${p.title}" | Location: "${p.location}"`);
        
        // Only geocode using location string - no fallbacks
        const coords = await geocodeLocation(p.location);
        
        // Only add to map if geocoding succeeded
        if (coords && Array.isArray(coords) && coords.length === 2) {
          const [lng, lat] = coords;
          
          // Verify coordinates are in Southwest Cameroon (lng 8.5-10.5, lat 3.8-5.5)
          const isInSouthwest = lng >= 8.5 && lng <= 10.5 && lat >= 3.8 && lat <= 5.5;
          
          if (isInSouthwest) {
            console.log(`✅ Geocoded "${p.location}" to Southwest: [${lng.toFixed(4)}, ${lat.toFixed(4)}]`);
            results.push({
              id: p.id || Math.random().toString(36),
              coordinates: coords,
              title: p.title,
              description: `${p.price?.toLocaleString?.() || p.price} FCFA`,
              property: p,
            });
          } else {
            console.warn(`⚠ Geocoded "${p.location}" OUTSIDE Southwest: [${lng.toFixed(4)}, ${lat.toFixed(4)}] - Skipping`);
          }
        } else {
          console.error(`❌ Failed to geocode "${p.location}" - Property "${p.title}" will not appear on map`);
        }
      }
      
      const failedCount = displayedProperties.length - results.length;
      console.log(`\n📊 Geocoding Summary: ${results.length}/${displayedProperties.length} properties shown on map (${failedCount} excluded)`);
      if (isMounted) setMarkers(results);
    })();
    return () => { isMounted = false; };
  }, [displayedProperties, geocodeLocation])

  const handleSearch = () => setActiveSearch(searchQuery.trim())
  const clearSearch = () => {
    setSearchQuery('')
    setActiveSearch('')
  }

  return (
    <div style={{ 
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: Colors.neutral[50],
      position: 'relative'
    }}>
      {/* Map Container */}
      <div style={{
        flex: 1,
        width: '100%',
        minHeight: '400px',
        position: 'relative'
      }}>
        <div style={{
          position: 'absolute',
          top: 12,
          left: 12,
          right: 12,
          display: 'flex',
          gap: 8,
          zIndex: 20
        }}>
          <div style={{ display: 'flex', gap: 8, flexDirection: 'row' }}>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
              placeholder="Search location..."
              style={{
                flex: 1,
                height: 42,
                borderRadius: 10,
                border: `1px solid ${Colors.neutral[300]}`,
                padding: '0 12px',
                outline: 'none'
              }}
            />
            <button onClick={handleSearch} style={{ borderRadius: 10, border: 'none', padding: '0 14px', background: Colors.primary[600], color: '#fff' }}>
              Search
            </button>
            {activeSearch && (
              <button onClick={clearSearch} style={{ borderRadius: 10, border: 'none', padding: '0 12px', background: Colors.neutral[200], color: Colors.neutral[800] }}>
                Clear
              </button>
            )}
          </div>
        </div>
        <MapView 
          markers={markers}
          userLocation={userLocation}
          onPropertyClick={(property) => navigate(`/property/${property.id}`)}
        />
      </div>

      {/* Property Cards */}
      {!loading && displayedProperties.length > 0 && (
        <MapPropertyCards
          properties={displayedProperties}
          onPropertySelect={(property) => navigate(`/property/${property.id}`)}
          onPropertyFocus={(property) => {
            // Could update map focus here if needed
            console.log('Focused property:', property.title)
          }}
        />
      )}
    </div>
  )
}
