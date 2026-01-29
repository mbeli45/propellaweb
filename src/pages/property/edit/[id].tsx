import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useThemeMode } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/I18nContext'
import { getColors } from '@/constants/Colors'
import { supabase } from '@/lib/supabase'
import AddProperty from '../add'
import './Edit.css'

export default function EditProperty() {
  const { id: propertyId } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { colorScheme } = useThemeMode()
  const { t } = useLanguage()
  const Colors = getColors(colorScheme)
  const navigate = useNavigate()

  const [property, setProperty] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Redirect if user is not an agent
    if (user && user.role !== 'agent') {
      navigate('/user')
      return
    }
  }, [user, navigate])

  useEffect(() => {
    if (!propertyId) return

    const fetchProperty = async () => {
      try {
        setLoading(true)
        const { data, error: fetchError } = await supabase
          .from('properties')
          .select('*')
          .eq('id', propertyId)
          .single()

        if (fetchError) throw fetchError
        if (!data) throw new Error('Property not found')

        // Check if user is an agent and owns the property
        if (user?.role !== 'agent' || data.owner_id !== user?.id) {
          throw new Error('You do not have permission to edit this property')
        }

        setProperty(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchProperty()
  }, [propertyId, user?.id])

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: Colors.neutral[50]
      }}>
        <div style={{ textAlign: 'center', color: Colors.neutral[600] }}>
          {t('common.loading')}...
        </div>
      </div>
    )
  }

  if (error || !property) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: Colors.neutral[50],
        padding: '20px'
      }}>
        <p style={{ color: Colors.error[600], marginBottom: '16px' }}>
          {error || 'Property not found'}
        </p>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: '12px 24px',
            backgroundColor: Colors.primary[600],
            color: Colors.white,
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          {t('common.back')}
        </button>
      </div>
    )
  }

  // Use the AddProperty component in edit mode
  return <AddProperty propertyId={propertyId} initialData={property} isEditMode={true} />
}
