import { useState, useEffect, useRef } from 'react'
import { PropertyData } from './PropertyCard'
import { captureMapError, trackMapInteraction } from '../lib/sentry'

interface MapViewProps {
  markers: Array<{
    id: string;
    coordinates: [number, number];
    title?: string;
    description?: string;
    property?: PropertyData;
  }>
  userLocation?: { lat: number; lng: number } | null
  onPropertyClick?: (property: PropertyData) => void
}

export default function MapView({ markers, userLocation, onPropertyClick }: MapViewProps) {
  const [mapLoaded, setMapLoaded] = useState(false)
  const mapRef = useRef<any>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const userMarkerRef = useRef<any>(null)

  useEffect(() => {
    // Load Mapbox GL JS
    const script = document.createElement('script')
    script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js'
    script.onload = () => {
      setMapLoaded(true)
      trackMapInteraction('mapbox_script_loaded')
    }
    script.onerror = (error) => {
      captureMapError(new Error('Failed to load Mapbox script'), {
        action: 'script_load',
        scriptSrc: script.src,
      })
    }
    document.head.appendChild(script)

    const link = document.createElement('link')
    link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css'
    link.rel = 'stylesheet'
    document.head.appendChild(link)

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script)
      }
      if (document.head.contains(link)) {
        document.head.removeChild(link)
      }
    }
  }, [])

  useEffect(() => {
    if (!mapLoaded || !window.mapboxgl || !mapRef.current) return

    const mapboxToken = import.meta.env.VITE_PUBLIC_MAPBOX_ACCESS_TOKEN
    if (!mapboxToken) {
      const error = new Error('Mapbox token not configured')
      console.warn(error.message)
      captureMapError(error, { action: 'token_missing' })
      return
    }

    try {
      window.mapboxgl.accessToken = mapboxToken

      // Clean up existing map
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        markersRef.current.forEach(marker => marker.remove())
        markersRef.current = []
        if (userMarkerRef.current) {
          userMarkerRef.current.remove()
          userMarkerRef.current = null
        }
      }

      // Determine center and zoom
      let center: [number, number] = [11.502, 3.848] // Default: Yaoundé, Cameroon
      let zoom = 12

      // If user location is available, use it
      if (userLocation) {
        center = [userLocation.lng, userLocation.lat]
        zoom = 13
      }

      trackMapInteraction('map_initializing', {
        center,
        zoom,
        hasUserLocation: !!userLocation,
        markerCount: markers.length,
      })

      const map = new window.mapboxgl.Map({
        container: mapRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center,
        zoom
      })

      mapInstanceRef.current = map

      // Track map errors
      map.on('error', (e: any) => {
        captureMapError(new Error(e.error?.message || 'Map error'), {
          action: 'map_error',
          errorType: e.error?.type,
          center,
          zoom,
        })
      })

      // Track successful map load
      map.on('load', () => {
        trackMapInteraction('map_loaded', { center, zoom })
      })

      // Add user location marker if available
      if (userLocation) {
        try {
          const userMarker = new window.mapboxgl.Marker({ color: '#0069FF' })
            .setLngLat([userLocation.lng, userLocation.lat])
            .addTo(map)
          userMarkerRef.current = userMarker
          trackMapInteraction('user_marker_added', { coordinates: userLocation })
        } catch (error) {
          captureMapError(error as Error, {
            action: 'add_user_marker',
            coordinates: userLocation,
          })
        }
      }

      // Add markers to map (already geocoded)
      markers.forEach((markerData) => {
        const { coordinates, title, description, property } = markerData
        
        try {
          const marker = new window.mapboxgl.Marker({ color: '#EF4444' })
            .setLngLat(coordinates)
            .setPopup(
              new window.mapboxgl.Popup().setHTML(`
                <div style="padding: 8px; min-width: 200px;">
                  <h3 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600;">${title || 'Property'}</h3>
                  <p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">${property?.location || ''}</p>
                  <p style="margin: 0; font-size: 14px; font-weight: 600; color: #1E40AF;">${description || ''}</p>
                </div>
              `)
            )
            .addTo(map)

          if (onPropertyClick && property) {
            marker.getElement().addEventListener('click', () => {
              trackMapInteraction('marker_clicked', { propertyId: property.id })
              onPropertyClick(property)
            })
          }

          markersRef.current.push(marker)
        } catch (error) {
          captureMapError(error as Error, {
            action: 'add_property_marker',
            coordinates: { lat: coordinates[1], lng: coordinates[0] },
            propertyId: property?.id,
          })
        }
      })

      // Center map on markers
      try {
        if (!userLocation && markers.length > 0) {
          const bounds = new window.mapboxgl.LngLatBounds()
          markers.forEach(({ coordinates }) => {
            bounds.extend(coordinates)
          })
          map.fitBounds(bounds, {
            padding: { top: 50, bottom: 200, left: 50, right: 50 },
            maxZoom: 15
          })
        } else if (userLocation && markers.length > 0) {
          // Center on user location but include properties in view
          const bounds = new window.mapboxgl.LngLatBounds()
          bounds.extend([userLocation.lng, userLocation.lat])
          markers.forEach(({ coordinates }) => {
            bounds.extend(coordinates)
          })
          map.fitBounds(bounds, {
            padding: { top: 50, bottom: 200, left: 50, right: 50 },
            maxZoom: 15
          })
        }
      } catch (error) {
        captureMapError(error as Error, {
          action: 'fit_bounds',
          markerCount: markers.length,
          hasUserLocation: !!userLocation,
        })
      }
    } catch (error) {
      captureMapError(error as Error, {
        action: 'map_initialization',
        markerCount: markers.length,
        hasUserLocation: !!userLocation,
      })
    }

    return () => {
      if (mapInstanceRef.current) {
        markersRef.current.forEach(marker => marker.remove())
        markersRef.current = []
        if (userMarkerRef.current) {
          userMarkerRef.current.remove()
          userMarkerRef.current = null
        }
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [mapLoaded, markers, userLocation, onPropertyClick])

  if (!mapLoaded) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        minHeight: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f3f4f6'
      }}>
        <p>Loading map...</p>
      </div>
    )
  }

  return (
    <div
      ref={mapRef}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '400px',
        position: 'relative'
      }}
    />
  )
}

// Extend Window interface for Mapbox
declare global {
  interface Window {
    mapboxgl: any
  }
}
