import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useThemeMode } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/I18nContext'
import { useDialog } from '@/contexts/DialogContext'
import { getColors } from '@/constants/Colors'
import { supabase } from '@/lib/supabase'
import { useStorage } from '@/hooks/useStorage'
import { ArrowLeft, Plus, X, Star, DollarSign, Square, Home, MapPin } from 'lucide-react'
import LocationSearchInput from '@/components/LocationSearchInput'
import './PropertyForm.css'

interface PropertyFormData {
  title: string
  description: string
  price: string
  location: string
  type: 'rent' | 'sale'
  category: 'budget' | 'standard' | 'premium' | 'luxury'
  propertyType: 'single_room' | 'apartment' | 'studio' | 'shop' | 'land' | 'house'
  bedrooms: string
  bathrooms: string
  area: string
  images: File[]
  reservationFee: string
  rentPeriod: 'monthly' | 'yearly'
  advance_months_min?: string
  advance_months_max?: string
}

interface MediaFile extends File {
  isVideo?: boolean
}

interface AddPropertyProps {
  propertyId?: string
  initialData?: any
  isEditMode?: boolean
}

export default function AddProperty({ propertyId, initialData, isEditMode = false }: AddPropertyProps = { propertyId: undefined, initialData: undefined, isEditMode: false }) {
  const { user } = useAuth()
  const { colorScheme } = useThemeMode()
  const { t } = useLanguage()
  const { alert } = useDialog()
  const Colors = getColors(colorScheme)
  const navigate = useNavigate()
  const { uploadMultipleImages, uploading } = useStorage()

  // Redirect if user is not an agent
  useEffect(() => {
    if (user && user.role !== 'agent') {
      navigate('/user')
    }
  }, [user, navigate])

  // Load property data if in edit mode
  useEffect(() => {
    if (isEditMode && initialData) {
      setForm({
        title: initialData.title || '',
        description: initialData.description || '',
        price: initialData.price?.toString() || '',
        location: initialData.location || '',
        type: initialData.type || 'rent',
        category: initialData.category || 'budget',
        propertyType: initialData.property_type || 'apartment',
        bedrooms: initialData.bedrooms?.toString() || '',
        bathrooms: initialData.bathrooms?.toString() || '',
        area: initialData.area?.toString() || '',
        images: [],
        reservationFee: initialData.reservation_fee?.toString() || '10000',
        rentPeriod: initialData.rent_period || 'yearly',
        advance_months_min: initialData.advance_months_min?.toString() || '',
        advance_months_max: initialData.advance_months_max?.toString() || '',
      })
      setExistingImages(initialData.images || [])
    }
  }, [isEditMode, initialData])

  const [form, setForm] = useState<PropertyFormData>({
    title: '',
    description: '',
    price: '',
    location: '',
    type: 'rent',
    category: 'budget',
    propertyType: 'apartment',
    bedrooms: '',
    bathrooms: '',
    area: '',
    images: [],
    reservationFee: '10000', // Default site visit fee
    rentPeriod: 'yearly',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [existingImages, setExistingImages] = useState<string[]>([])

  // Auto-set site visit fee based on type
  useEffect(() => {
    if (form.type === 'rent') {
      setForm(prev => ({ ...prev, reservationFee: '10000' }))
    } else if (form.type === 'sale') {
      setForm(prev => ({ ...prev, reservationFee: '15000' }))
    }
  }, [form.type])

  const handleInputChange = (field: keyof PropertyFormData, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      // Check if any file exceeds 10MB limit
      const maxSize = 10 * 1024 * 1024 // 10MB
      const validFiles = files.filter(file => {
        if (file.size > maxSize) {
          alert(`${file.name} is too large. Maximum file size is 10MB.`, 'error')
          return false
        }
        return true
      })

      if (validFiles.length > 0) {
        const maxNewImages = isEditMode ? Math.max(0, 10 - existingImages.length) : 10
        setForm(prev => ({ ...prev, images: [...prev.images, ...validFiles].slice(0, maxNewImages) }))
      }
    }
  }

  const removeImage = (index: number) => {
    setForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  const isVideoFile = (file: File) => {
    return file.type.startsWith('video/') || 
           file.name.toLowerCase().endsWith('.mp4') ||
           file.name.toLowerCase().endsWith('.mov') ||
           file.name.toLowerCase().endsWith('.avi') ||
           file.name.toLowerCase().endsWith('.mkv')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id || user.role !== 'agent') {
      alert(t('auth.mustBeAgentToAdd') || 'Only agents can add properties', 'error')
      navigate('/user')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      // Upload new images first
      let newImageUrls: string[] = []
      if (form.images.length > 0) {
        const uploadResults = await uploadMultipleImages(
          form.images,
          'properties',
          'uploads'
        )
        newImageUrls = uploadResults.map(r => r.url).filter(Boolean)
      }

      // Combine existing images with new ones
      const allImageUrls = isEditMode 
        ? [...existingImages, ...newImageUrls]
        : newImageUrls

      // Determine category based on price if not set
      const priceNum = parseFloat(form.price) || 0
      let category = form.category
      if (!category || category === 'budget') {
        if (priceNum >= 10000000) category = 'luxury'
        else if (priceNum >= 5000000) category = 'premium'
        else if (priceNum >= 2000000) category = 'standard'
        else category = 'budget'
      }

      const propertyData = {
        title: form.title,
        description: form.description,
        price: parseFloat(form.price) || 0,
        location: form.location,
        type: form.type,
        category,
        property_type: form.propertyType,
        bedrooms: form.bedrooms ? parseInt(form.bedrooms) : null,
        bathrooms: form.bathrooms ? parseInt(form.bathrooms) : null,
        area: form.area ? parseFloat(form.area) : null,
        images: allImageUrls,
        reservation_fee: form.reservationFee ? parseFloat(form.reservationFee) : null,
        rent_period: form.type === 'rent' ? form.rentPeriod : null,
        advance_months_min: form.advance_months_min ? parseInt(form.advance_months_min) : null,
        advance_months_max: form.advance_months_max ? parseInt(form.advance_months_max) : null,
        updated_at: new Date().toISOString(),
      }

      if (isEditMode && propertyId) {
        // Update existing property
        const { data, error: updateError } = await supabase
          .from('properties')
          .update(propertyData)
          .eq('id', propertyId)
          .eq('owner_id', user.id)
          .select()
          .single()

        if (updateError) throw updateError

        alert(t('property.propertyUpdated') || 'Property updated successfully', 'success')
        navigate(`/property/${propertyId}`)
      } else {
        // Create new property
        const { data, error: insertError } = await supabase
          .from('properties')
          .insert({
            ...propertyData,
            owner_id: user.id,
            status: 'available',
          })
          .select()
          .single()

        if (insertError) throw insertError

        alert(t('property.propertyAdded') || 'Property added successfully', 'success')
        navigate(`/property/${data.id}`)
      }
    } catch (err: any) {
      const errorMessage = err.message || (isEditMode ? t('property.failedToUpdateProperty') : t('property.failedToAddProperty')) || 'Failed to save property'
      setError(errorMessage)
      alert(errorMessage, 'error')
      console.error('Error saving property:', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="property-form-container" style={{ backgroundColor: Colors.neutral[50] }}>
      {/* Header */}
      <div className="property-form-header" style={{
        backgroundColor: Colors.white,
        padding: '16px 20px',
        borderBottom: `1px solid ${Colors.neutral[100]}`,
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '8px',
            transition: 'background 0.2s',
            marginLeft: '-8px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = Colors.neutral[100]
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
        >
          <ArrowLeft size={24} color={Colors.neutral[900]} />
        </button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <h1 style={{ fontSize: '20px', fontWeight: '600', color: Colors.neutral[900], margin: 0 }}>
            {isEditMode ? (t('property.editProperty') || 'Edit Property') : (t('property.addProperty') || 'Add Property')}
          </h1>
          <p style={{ fontSize: '14px', color: Colors.neutral[600], margin: '2px 0 0 0' }}>
            {isEditMode ? (t('property.editPropertyDescription') || 'Update your property details') : (t('property.addNewProperty') || 'Add a new property to your listings')}
          </p>
        </div>
        <div style={{
          backgroundColor: Colors.primary[50],
          padding: '8px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Plus size={20} color={Colors.primary[600]} />
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="property-form-content">
        {error && (
          <div className="error-message" style={{
            backgroundColor: Colors.error[50],
            color: Colors.error[700],
            borderLeftColor: Colors.error[600]
          }}>
            {error}
          </div>
        )}

        {/* Basic Information Section */}
        <div className="form-section" style={{ backgroundColor: Colors.white }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{
              backgroundColor: Colors.primary[50],
              padding: '8px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Home size={20} color={Colors.primary[600]} />
            </div>
            <h2 style={{ color: Colors.neutral[900], margin: 0, fontSize: '16px', fontWeight: '600' }}>
              {t('propertyForm.basicInformation') || 'Basic Information'}
            </h2>
          </div>
          
          <div className="form-group">
            <label>{t('property.title')} *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              required
              placeholder={t('form.propertyTitleExample') || 'e.g., Modern 2BR Apartment in City Center'}
            />
          </div>

          <div className="form-group">
            <label>{t('property.description')} *</label>
            <textarea
              value={form.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              required
              placeholder={t('form.describeProperty') || 'Describe your property\'s features, amenities, and what makes it special...'}
            />
          </div>
        </div>

        {/* Location Section */}
        <div className="form-section" style={{ backgroundColor: Colors.white }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{
              backgroundColor: Colors.primary[50],
              padding: '8px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <MapPin size={20} color={Colors.primary[600]} />
            </div>
            <h2 style={{ color: Colors.neutral[900], margin: 0, fontSize: '16px', fontWeight: '600' }}>
              {t('propertyForm.location') || 'Location'}
            </h2>
          </div>

          <div className="form-group">
            <label style={{ color: Colors.neutral[700] }}>{t('property.location')} *</label>
            <LocationSearchInput
              value={form.location}
              onChange={(value) => handleInputChange('location', value)}
              onLocationSelect={(location) => {
                console.log('Selected location:', location)
                handleInputChange('location', location.place_name)
              }}
              placeholder={t('form.searchPropertyLocation') || 'Search for property location...'}
              required
            />
          </div>
        </div>

        {/* Property Type Section */}
        <div className="form-section" style={{ backgroundColor: Colors.white }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{
              backgroundColor: Colors.primary[50],
              padding: '8px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Star size={20} color={Colors.primary[600]} />
            </div>
            <h2 style={{ color: Colors.neutral[900], margin: 0, fontSize: '16px', fontWeight: '600' }}>
              {t('propertyForm.propertyType') || 'Property Type'}
            </h2>
          </div>

          <div className="form-group">
            <label style={{ color: Colors.neutral[700], marginBottom: '12px', display: 'block' }}>
              {t('propertyForm.listingType') || 'Listing Type'}
            </label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => handleInputChange('type', 'rent')}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  borderRadius: '24px',
                  border: `2px solid ${form.type === 'rent' ? Colors.primary[600] : Colors.neutral[300]}`,
                  backgroundColor: form.type === 'rent' ? Colors.primary[600] : (colorScheme === 'dark' ? Colors.neutral[200] : Colors.white),
                  color: form.type === 'rent' ? '#FFFFFF' : Colors.neutral[700],
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {t('property.rent') || 'For Rent'}
              </button>
              <button
                type="button"
                onClick={() => handleInputChange('type', 'sale')}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  borderRadius: '24px',
                  border: `2px solid ${form.type === 'sale' ? Colors.primary[600] : Colors.neutral[300]}`,
                  backgroundColor: form.type === 'sale' ? Colors.primary[600] : (colorScheme === 'dark' ? Colors.neutral[200] : Colors.white),
                  color: form.type === 'sale' ? '#FFFFFF' : Colors.neutral[700],
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {t('property.sale') || 'For Sale'}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label style={{ color: Colors.neutral[700] }}>{t('property.propertyType') || 'Property Type'}</label>
            <select
              value={form.propertyType}
              onChange={(e) => handleInputChange('propertyType', e.target.value)}
              style={{
                borderColor: Colors.neutral[300],
                backgroundColor: Colors.neutral[50],
                color: Colors.neutral[900]
              }}
            >
              <option value="apartment">{t('property.apartment') || 'Apartment'}</option>
              <option value="house">{t('property.house') || 'House'}</option>
              <option value="studio">{t('property.studio') || 'Studio'}</option>
              <option value="single_room">{t('property.singleRoom') || 'Single Room'}</option>
              <option value="shop">{t('property.shop') || 'Shop'}</option>
              <option value="land">{t('property.land') || 'Land'}</option>
            </select>
          </div>
        </div>

        {/* Pricing Section */}
        {form.type === 'rent' && (
          <div className="form-section" style={{ backgroundColor: Colors.white }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{
                backgroundColor: Colors.primary[50],
                padding: '8px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <DollarSign size={20} color={Colors.primary[600]} />
              </div>
              <h2 style={{ color: Colors.neutral[900], margin: 0, fontSize: '16px', fontWeight: '600' }}>
                {t('propertyForm.pricing') || 'Pricing'}
              </h2>
            </div>

            <div className="form-group">
              <label style={{ color: Colors.neutral[700], marginBottom: '12px', display: 'block' }}>
                {t('propertyForm.howEnterRent') || 'How would you like to enter the rent?'}
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => handleInputChange('rentPeriod', 'monthly')}
                  style={{
                    flex: 1,
                    padding: '12px 20px',
                    borderRadius: '24px',
                    border: `2px solid ${form.rentPeriod === 'monthly' ? Colors.primary[600] : Colors.neutral[300]}`,
                    backgroundColor: form.rentPeriod === 'monthly' ? Colors.primary[50] : (colorScheme === 'dark' ? Colors.neutral[200] : Colors.white),
                  color: form.rentPeriod === 'monthly' ? Colors.primary[600] : Colors.neutral[700],
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {t('propertyForm.monthly') || 'Monthly'}
                </button>
                <button
                  type="button"
                  onClick={() => handleInputChange('rentPeriod', 'yearly')}
                  style={{
                    flex: 1,
                    padding: '12px 20px',
                    borderRadius: '24px',
                    border: `2px solid ${form.rentPeriod === 'yearly' ? Colors.primary[600] : Colors.neutral[300]}`,
                    backgroundColor: form.rentPeriod === 'yearly' ? Colors.primary[50] : (colorScheme === 'dark' ? Colors.neutral[200] : Colors.white),
                  color: form.rentPeriod === 'yearly' ? Colors.primary[600] : Colors.neutral[700],
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {t('propertyForm.yearly') || 'Yearly'}
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ color: Colors.neutral[700] }}>
                  {form.rentPeriod === 'monthly' ? t('propertyForm.monthlyRentFCFA') || 'Monthly Rent (FCFA)' : t('propertyForm.yearlyRentFCFA') || 'Yearly Rent (FCFA)'} *
                </label>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  required
                  min="0"
                  placeholder="0"
                  style={{
                    borderColor: Colors.neutral[300],
                    backgroundColor: Colors.neutral[50],
                    color: Colors.neutral[900]
                  }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ color: Colors.neutral[700] }}>
                  {t('propertyForm.reservationFeeFCFA') || 'Reservation Fee (FCFA)'} *
                </label>
                <div style={{
                  padding: '12px 14px',
                  border: `1px solid ${Colors.neutral[300]}`,
                  borderRadius: '10px',
                  backgroundColor: Colors.neutral[100],
                  color: Colors.neutral[700],
                  fontSize: '15px',
                  fontWeight: '500'
                }}>
                  {form.reservationFee || '0'} FCFA
                </div>
                <p style={{
                  fontSize: '11px',
                  color: Colors.neutral[600],
                  marginTop: '4px',
                  fontStyle: 'italic'
                }}>
                  {t('propertyForm.autoSetReservationFee') || 'Auto-set based on listing type (Read-only)'}
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ color: Colors.neutral[700] }}>
                  {t('propertyForm.minAdvanceMonths') || 'Min Advance (months)'}
                </label>
                <input
                  type="number"
                  value={form.advance_months_min || ''}
                  onChange={(e) => handleInputChange('advance_months_min', e.target.value)}
                  min="0"
                  placeholder="6"
                  style={{
                    borderColor: Colors.neutral[300],
                    backgroundColor: Colors.neutral[50],
                    color: Colors.neutral[900]
                  }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ color: Colors.neutral[700] }}>
                  {t('propertyForm.maxAdvanceMonths') || 'Max Advance (months)'}
                </label>
                <input
                  type="number"
                  value={form.advance_months_max || ''}
                  onChange={(e) => handleInputChange('advance_months_max', e.target.value)}
                  min="0"
                  placeholder="12"
                  style={{
                    borderColor: Colors.neutral[300],
                    backgroundColor: Colors.neutral[50],
                    color: Colors.neutral[900]
                  }}
                />
              </div>
            </div>
            <p style={{
              fontSize: '12px',
              color: Colors.neutral[600],
              marginTop: '8px',
              marginBottom: 0
            }}>
              {t('propertyForm.advancePaymentNote') || 'Advance payment is typically 6-12 months of rent paid upfront'}
            </p>
          </div>
        )}

        {form.type === 'sale' && (
          <div className="form-section" style={{ backgroundColor: Colors.white }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{
                backgroundColor: Colors.primary[50],
                padding: '8px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <DollarSign size={20} color={Colors.primary[600]} />
              </div>
              <h2 style={{ color: Colors.neutral[900], margin: 0, fontSize: '16px', fontWeight: '600' }}>
                {t('propertyForm.pricing') || 'Pricing'}
              </h2>
            </div>

            <div className="form-group">
              <label style={{ color: Colors.neutral[700] }}>
                {t('property.price')} (FCFA) *
              </label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                required
                min="0"
                placeholder="0"
                style={{
                  borderColor: Colors.neutral[300],
                  backgroundColor: Colors.neutral[50],
                  color: Colors.neutral[900]
                }}
              />
            </div>

            <div className="form-group">
              <label style={{ color: Colors.neutral[700] }}>
                {t('propertyForm.reservationFeeFCFA') || 'Reservation Fee (FCFA)'} *
              </label>
              <div style={{
                padding: '12px 14px',
                border: `1px solid ${Colors.neutral[300]}`,
                borderRadius: '10px',
                backgroundColor: Colors.neutral[100],
                color: Colors.neutral[700],
                fontSize: '15px',
                fontWeight: '500'
              }}>
                {form.reservationFee || '0'} FCFA
              </div>
              <p style={{
                fontSize: '11px',
                color: Colors.neutral[600],
                marginTop: '4px',
                fontStyle: 'italic'
              }}>
                {t('propertyForm.autoSetReservationFee') || 'Auto-set based on listing type (Read-only)'}
              </p>
            </div>
          </div>
        )}

        {/* Property Details Section */}
        <div className="form-section" style={{ backgroundColor: Colors.white }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{
              backgroundColor: Colors.primary[50],
              padding: '8px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Square size={20} color={Colors.primary[600]} />
            </div>
            <h2 style={{ color: Colors.neutral[900], margin: 0, fontSize: '16px', fontWeight: '600' }}>
              {t('propertyForm.propertyDetails') || 'Property Details'}
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ color: Colors.neutral[700] }}>{t('property.bedrooms') || 'Bedrooms'}</label>
              <input
                type="number"
                value={form.bedrooms}
                onChange={(e) => handleInputChange('bedrooms', e.target.value)}
                min="0"
                placeholder="0"
                style={{
                  borderColor: Colors.neutral[300],
                  backgroundColor: Colors.neutral[50],
                  color: Colors.neutral[900]
                }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ color: Colors.neutral[700] }}>{t('property.bathrooms') || 'Bathrooms'}</label>
              <input
                type="number"
                value={form.bathrooms}
                onChange={(e) => handleInputChange('bathrooms', e.target.value)}
                min="0"
                placeholder="0"
                style={{
                  borderColor: Colors.neutral[300],
                  backgroundColor: Colors.neutral[50],
                  color: Colors.neutral[900]
                }}
              />
            </div>
          </div>

          <div className="form-group">
            <label style={{ color: Colors.neutral[700] }}>{t('property.area')} (m²)</label>
            <input
              type="number"
              value={form.area}
              onChange={(e) => handleInputChange('area', e.target.value)}
              min="0"
              placeholder="0"
              style={{
                borderColor: Colors.neutral[300],
                backgroundColor: Colors.neutral[50],
                color: Colors.neutral[900]
              }}
            />
          </div>
        </div>

        {/* Property Photos Section */}
        <div className="form-section" style={{ backgroundColor: Colors.white }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{
              backgroundColor: Colors.primary[50],
              padding: '8px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Home size={20} color={Colors.primary[600]} />
            </div>
            <h2 style={{ color: Colors.neutral[900], margin: 0, fontSize: '16px', fontWeight: '600' }}>
              {t('propertyForm.propertyPhotos') || 'Property Photos'}
            </h2>
          </div>
          
          <p style={{
            fontSize: '13px',
            color: Colors.neutral[600],
            marginBottom: '8px'
          }}>
            {t('propertyForm.addPhotosVideos', { count: form.images.length + existingImages.length }) || `Add high-quality photos and videos to showcase your property (${form.images.length + existingImages.length}/10)`}
          </p>
          <p style={{
            fontSize: '12px',
            color: Colors.neutral[600],
            marginBottom: '16px'
          }}>
            {t('propertyForm.supportedFormats') || 'Supported: Images (JPG, PNG) and Videos (MP4, MOV)'}
          </p>

          <div className="image-upload-area">
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleImageSelect}
              style={{ display: 'none' }}
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className="image-upload-label"
              style={{
                borderColor: Colors.neutral[300],
                backgroundColor: Colors.neutral[50]
              }}
            >
              <Plus size={32} color={Colors.primary[600]} />
              <span style={{ color: Colors.neutral[700] }}>
                {t('propertyForm.addPhotoVideo') || 'Add photo or video'}
              </span>
            </label>
          </div>

          {((isEditMode && existingImages.length > 0) || form.images.length > 0) && (
            <div className="image-preview-grid">
              {/* Show existing images in edit mode */}
              {isEditMode && existingImages.map((imageUrl, index) => (
                <div key={`existing-${index}`} className="image-preview-item">
                  <img src={imageUrl} alt={`Property ${index + 1}`} />
                  <button
                    type="button"
                    onClick={() => {
                      setExistingImages(prev => prev.filter((_, i) => i !== index))
                    }}
                    className="remove-image-btn"
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      backgroundColor: 'rgba(0, 0, 0, 0.6)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '28px',
                      height: '28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <X size={16} color="white" />
                  </button>
                </div>
              ))}
              {/* Show new images */}
              {form.images.map((file, index) => {
                const isVideo = isVideoFile(file)
                return (
                  <div key={index} className="image-preview-item">
                    {isVideo ? (
                      <>
                        <video
                          src={URL.createObjectURL(file)}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                        <div style={{
                          position: 'absolute',
                          top: '6px',
                          left: '6px',
                          backgroundColor: Colors.error[600],
                          color: '#FFFFFF',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: '600',
                          textTransform: 'uppercase'
                        }}>
                          Video
                        </div>
                      </>
                    ) : (
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index + 1}`}
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="image-remove-btn"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="form-submit-section" style={{
          backgroundColor: Colors.white,
          borderTopColor: Colors.neutral[200]
        }}>
          <button
            type="submit"
            disabled={submitting || uploading}
            className="form-submit-btn"
            style={{
              backgroundColor: submitting || uploading ? Colors.neutral[400] : Colors.primary[600],
              color: '#FFFFFF'
            }}
          >
            {submitting || uploading 
              ? (t('buttons.saving') || 'Saving...') 
              : (t('buttons.submit') || 'Submit')
            }
          </button>
        </div>
      </form>
    </div>
  )
}
