import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useThemeMode } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/I18nContext'
import { getColors } from '@/constants/Colors'
import { supabase } from '@/lib/supabase'
import { useStorage } from '@/hooks/useStorage'
import { ArrowLeft, Plus, X } from 'lucide-react'
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

export default function AddProperty() {
  const { user } = useAuth()
  const { colorScheme } = useThemeMode()
  const { t } = useLanguage()
  const Colors = getColors(colorScheme)
  const navigate = useNavigate()
  const { uploadMultipleImages, uploading } = useStorage()

  // Redirect if user is not an agent
  useEffect(() => {
    if (user && user.role !== 'agent') {
      navigate('/user')
    }
  }, [user, navigate])

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
          alert(`${file.name} is too large. Maximum file size is 10MB.`)
          return false
        }
        return true
      })

      if (validFiles.length > 0) {
        setForm(prev => ({ ...prev, images: [...prev.images, ...validFiles].slice(0, 10) }))
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
      alert(t('auth.mustBeAgentToAdd') || 'Only agents can add properties')
      navigate('/user')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      // Upload images first
      let imageUrls: string[] = []
      if (form.images.length > 0) {
        const uploadResults = await uploadMultipleImages(
          form.images,
          'properties',
          'uploads'
        )
        imageUrls = uploadResults.map(r => r.url).filter(Boolean)
      }

      // Determine category based on price if not set
      const priceNum = parseFloat(form.price) || 0
      let category = form.category
      if (!category || category === 'budget') {
        if (priceNum >= 10000000) category = 'luxury'
        else if (priceNum >= 5000000) category = 'premium'
        else if (priceNum >= 2000000) category = 'standard'
        else category = 'budget'
      }

      // Create property
      const { data, error: insertError } = await supabase
        .from('properties')
        .insert({
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
          images: imageUrls,
          reservation_fee: form.reservationFee ? parseFloat(form.reservationFee) : null,
          rent_period: form.type === 'rent' ? form.rentPeriod : null,
          advance_months_min: form.advance_months_min ? parseInt(form.advance_months_min) : null,
          advance_months_max: form.advance_months_max ? parseInt(form.advance_months_max) : null,
          owner_id: user.id,
          status: 'available',
        })
        .select()
        .single()

      if (insertError) throw insertError

      alert(t('property.propertyAdded') || 'Property added successfully')
      navigate(`/property/${data.id}`)
    } catch (err: any) {
      setError(err.message || t('property.failedToAddProperty') || 'Failed to add property')
      console.error('Error adding property:', err)
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
            {t('property.addProperty')}
          </h1>
          <p style={{ fontSize: '14px', color: Colors.neutral[600], margin: '2px 0 0 0' }}>
            {t('property.addNewProperty')}
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

        {/* Basic Information */}
        <div className="form-section" style={{ backgroundColor: Colors.white }}>
          <h2 style={{ color: Colors.neutral[900] }}>
            {t('propertyForm.basicInformation')}
          </h2>
          
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
            <label>{t('property.description')}</label>
            <textarea
              value={form.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              placeholder={t('form.describeProperty') || 'Describe your property...'}
            />
          </div>

          <div className="form-group">
            <label style={{ color: Colors.neutral[700] }}>{t('property.price')} (FCFA) *</label>
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
            <label style={{ color: Colors.neutral[700] }}>{t('property.type')} *</label>
            <select
              value={form.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              required
              style={{
                borderColor: Colors.neutral[300],
                backgroundColor: Colors.neutral[50],
                color: Colors.neutral[900]
              }}
            >
              <option value="rent">{t('property.rent')}</option>
              <option value="sale">{t('property.sale')}</option>
            </select>
          </div>

          {form.type === 'rent' && (
            <div className="form-group">
              <label>{t('property.rentPeriod')}</label>
              <select
                value={form.rentPeriod}
                onChange={(e) => handleInputChange('rentPeriod', e.target.value)}
              >
                <option value="monthly">{t('propertyForm.monthly')}</option>
                <option value="yearly">{t('propertyForm.yearly')}</option>
              </select>
            </div>
          )}

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

        {/* Property Details */}
        <div className="form-section" style={{ backgroundColor: Colors.white }}>
          <h2 style={{ color: Colors.neutral[900] }}>
            {t('propertyForm.propertyDetails')}
          </h2>

          <div className="form-group">
            <label style={{ color: Colors.neutral[700] }}>{t('property.propertyType')}</label>
            <select
              value={form.propertyType}
              onChange={(e) => handleInputChange('propertyType', e.target.value)}
              style={{
                borderColor: Colors.neutral[300],
                backgroundColor: Colors.neutral[50],
                color: Colors.neutral[900]
              }}
            >
              <option value="apartment">{t('property.apartment')}</option>
              <option value="house">{t('property.house')}</option>
              <option value="studio">{t('property.studio')}</option>
              <option value="single_room">{t('property.singleRoom')}</option>
              <option value="shop">{t('property.shop')}</option>
              <option value="land">{t('property.land')}</option>
            </select>
          </div>

          <div className="form-group">
            <label style={{ color: Colors.neutral[700] }}>{t('property.bedrooms')}</label>
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

          <div className="form-group">
            <label style={{ color: Colors.neutral[700] }}>{t('property.bathrooms')}</label>
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

        {/* Images & Videos */}
        <div className="form-section" style={{ backgroundColor: Colors.white }}>
          <h2 style={{ color: Colors.neutral[900] }}>
            {t('propertyForm.propertyPhotos') || t('property.images')}
          </h2>
          <p style={{
            fontSize: '13px',
            color: Colors.neutral[600],
            marginBottom: '16px',
            marginTop: '-8px'
          }}>
            {t('propertyForm.addPhotosVideos') || `Add high-quality photos and videos to showcase your property (${form.images.length}/10)`}
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
                {t('propertyForm.addMediaButton') || 'Add Photos & Videos'}
              </span>
            </label>
          </div>

          {form.images.length > 0 && (
            <div className="image-preview-grid">
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
                          color: Colors.white,
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

        {/* Additional Information */}
        <div className="form-section" style={{ backgroundColor: Colors.white }}>
          <h2 style={{ color: Colors.neutral[900] }}>
            {t('propertyForm.additionalInformation') || 'Additional Information'}
          </h2>

          <div className="form-group">
            <label style={{ color: Colors.neutral[700] }}>
              {t('propertyForm.reservationFeeFCFA') || t('property.reservationFee')} <span style={{ color: Colors.error[600] }}>*</span>
            </label>
            <div style={{
              padding: '12px 14px',
              border: `1px solid ${Colors.neutral[300]}`,
              borderRadius: '10px',
              backgroundColor: Colors.neutral[100],
              color: Colors.neutral[700],
              fontSize: '16px',
              fontWeight: '600'
            }}>
              {form.reservationFee || '0'} FCFA
            </div>
            <p style={{
              fontSize: '11px',
              color: Colors.neutral[600],
              marginTop: '4px',
              fontStyle: 'italic'
            }}>
              {form.type === 'rent' 
                ? t('propertyForm.siteVisitFeeNote') || 'Standard site visit fee for rental properties'
                : t('propertyForm.siteVisitFeeSaleNote') || 'Standard site visit fee for properties on sale'
              }
            </p>
          </div>

          {form.type === 'rent' && (
            <>
              <div className="form-group">
                <label style={{ color: Colors.neutral[700] }}>{t('propertyForm.minAdvanceMonths')}</label>
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

              <div className="form-group">
                <label style={{ color: Colors.neutral[700] }}>{t('propertyForm.maxAdvanceMonths')}</label>
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
            </>
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
              color: Colors.white
            }}
          >
            {submitting || uploading 
              ? (t('buttons.saving') || 'Saving...') 
              : t('property.addProperty')
            }
          </button>
        </div>
      </form>
    </div>
  )
}
