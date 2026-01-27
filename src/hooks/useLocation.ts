import { useState } from 'react'

export interface LocationObject {
  coords: {
    latitude: number
    longitude: number
    altitude: number | null
    accuracy: number
    altitudeAccuracy: number | null
    heading: number | null
    speed: number | null
  }
  timestamp: number
}

export interface LocationGeocodedAddress {
  street?: string
  city?: string
  region?: string
  country?: string
  postalCode?: string
  name?: string
}

export function useLocation() {
  const [location, setLocation] = useState<LocationObject | null>(null)
  const [address, setAddress] = useState<LocationGeocodedAddress | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const requestPermissions = async (): Promise<boolean> => {
    try {
      setLoading(true)
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by your browser')
      }
      return true
    } catch (error: any) {
      setError(error.message)
      return false
    } finally {
      setLoading(false)
    }
  }

  const getCurrentLocation = async (): Promise<LocationObject> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const err = new Error('Geolocation is not supported')
        setError(err.message)
        reject(err)
        return
      }

      setLoading(true)
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationObj: LocationObject = {
            coords: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              altitude: position.coords.altitude,
              accuracy: position.coords.accuracy,
              altitudeAccuracy: position.coords.altitudeAccuracy,
              heading: position.coords.heading,
              speed: position.coords.speed,
            },
            timestamp: position.timestamp,
          }
          setLocation(locationObj)
          setLoading(false)
          resolve(locationObj)
        },
        (err) => {
          setError(err.message)
          setLoading(false)
          reject(err)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      )
    })
  }

  const getAddressFromCoordinates = async (
    latitude: number,
    longitude: number
  ): Promise<LocationGeocodedAddress> => {
    try {
      setLoading(true)
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${import.meta.env.VITE_PUBLIC_MAPBOX_ACCESS_TOKEN || ''}`
      )
      const data = await response.json()
      
      if (data.features && data.features.length > 0) {
        const feature = data.features[0]
        const context = feature.context || []
        
        const addressObj: LocationGeocodedAddress = {
          name: feature.place_name,
          street: feature.text,
          city: context.find((c: any) => c.id.startsWith('place'))?.text,
          region: context.find((c: any) => c.id.startsWith('region'))?.text,
          country: context.find((c: any) => c.id.startsWith('country'))?.text,
          postalCode: context.find((c: any) => c.id.startsWith('postcode'))?.text,
        }
        setAddress(addressObj)
        return addressObj
      }
      throw new Error('No address found')
    } catch (error: any) {
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return {
    location,
    address,
    loading,
    error,
    requestPermissions,
    getCurrentLocation,
    getAddressFromCoordinates,
  }
}
