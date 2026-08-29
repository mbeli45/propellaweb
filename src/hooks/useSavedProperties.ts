import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { PropertyData } from '@/components/PropertyCard'
import { captureException } from '@/lib/sentry'

const PROPERTY_SELECT = `
  id,
  created_at,
  property_id,
  properties:property_id (
    id,
    title,
    description,
    price,
    location,
    town,
    availability_confirmed_at,
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
  )
`

const transformProperty = (property: any): PropertyData => ({
  id: property.id,
  title: property.title,
  description: property.description || undefined,
  price: property.price,
  location: property.location,
  town: property.town || undefined,
  availability_confirmed_at: property.availability_confirmed_at ?? undefined,
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
  owner: property.profiles
    ? {
        id: property.profiles.id,
        full_name: property.profiles.full_name || undefined,
        avatar_url: property.profiles.avatar_url || undefined,
        email: property.profiles.email || undefined,
        role: property.profiles.role || undefined,
      }
    : undefined,
})

/**
 * Full list of a user's bookmarked properties, newest first.
 */
export function useSavedProperties(userId: string | undefined) {
  const [properties, setProperties] = useState<PropertyData[]>([])
  const [loading, setLoading] = useState(!!userId)
  const [error, setError] = useState<string | null>(null)

  const fetchSaved = useCallback(async () => {
    if (!userId) {
      setProperties([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: queryError } = await supabase
        .from('saved_properties')
        .select(PROPERTY_SELECT)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (queryError) throw queryError

      // The embedded join can be null if the property row is not readable
      // under RLS, so drop those rows rather than rendering blanks.
      const transformed = (data || [])
        .map((row: any) => row.properties)
        .filter(Boolean)
        .map(transformProperty)

      setProperties(transformed)
    } catch (e: any) {
      setError(e?.message || 'Failed to load saved properties')
      setProperties([])
      captureException(e, { context: 'useSavedProperties.fetchSaved', userId })
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchSaved()
  }, [fetchSaved])

  const removeSaved = useCallback(
    async (propertyId: string) => {
      if (!userId) return false

      const previous = properties
      setProperties(prev => prev.filter(p => p.id !== propertyId))

      const { error: deleteError } = await supabase
        .from('saved_properties')
        .delete()
        .eq('user_id', userId)
        .eq('property_id', propertyId)

      if (deleteError) {
        setProperties(previous)
        setError(deleteError.message)
        return false
      }

      return true
    },
    [userId, properties]
  )

  return { properties, loading, error, refresh: fetchSaved, removeSaved }
}

/**
 * Saved state for a single property, with an optimistic toggle.
 */
export function useSavedProperty(userId: string | undefined, propertyId: string | undefined) {
  const [isSaved, setIsSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false

    const checkSaved = async () => {
      if (!userId || !propertyId) {
        setIsSaved(false)
        return
      }

      const { data, error } = await supabase
        .from('saved_properties')
        .select('id')
        .eq('user_id', userId)
        .eq('property_id', propertyId)
        .maybeSingle()

      if (cancelled) return
      if (error) {
        captureException(error, { context: 'useSavedProperty.checkSaved', userId, propertyId })
        return
      }
      setIsSaved(!!data)
    }

    checkSaved()
    return () => {
      cancelled = true
    }
  }, [userId, propertyId])

  const toggleSaved = useCallback(async () => {
    if (!userId || !propertyId || loading) {
      return { ok: false as const, requiresAuth: !userId }
    }

    const next = !isSaved
    setIsSaved(next)
    setLoading(true)

    try {
      if (next) {
        const { error } = await supabase
          .from('saved_properties')
          .upsert({ user_id: userId, property_id: propertyId }, { onConflict: 'user_id,property_id' })
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('saved_properties')
          .delete()
          .eq('user_id', userId)
          .eq('property_id', propertyId)
        if (error) throw error
      }
      return { ok: true as const, isSaved: next }
    } catch (e: any) {
      setIsSaved(!next)
      captureException(e, { context: 'useSavedProperty.toggleSaved', userId, propertyId })
      return { ok: false as const, requiresAuth: false, error: e?.message }
    } finally {
      setLoading(false)
    }
  }, [userId, propertyId, isSaved, loading])

  return { isSaved, loading, toggleSaved }
}
