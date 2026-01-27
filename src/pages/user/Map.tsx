import React, { useState, useEffect } from 'react'
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
      console.log('Starting geocoding for', properties.length, 'properties');
      const results: Array<{
        id: string;
        coordinates: [number, number];
        title?: string;
        description?: string;
        property?: any;
      }> = [];
      
      for (const p of properties) {
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
      
      const failedCount = properties.length - results.length;
      console.log(`\n📊 Geocoding Summary: ${results.length}/${properties.length} properties shown on map (${failedCount} excluded)`);
      if (isMounted) setMarkers(results);
    })();
    return () => { isMounted = false; };
  }, [properties, geocodeLocation])

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
        <MapView 
          markers={markers}
          userLocation={userLocation}
          onPropertyClick={(property) => navigate(`/property/${property.id}`)}
        />
      </div>

      {/* Property Cards */}
      {!loading && properties.length > 0 && (
        <MapPropertyCards
          properties={properties}
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
