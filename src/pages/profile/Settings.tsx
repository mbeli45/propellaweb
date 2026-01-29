import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useThemeMode } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/I18nContext'
import { useDialog } from '@/contexts/DialogContext'
import { getColors } from '@/constants/Colors'
import { useStorage } from '@/hooks/useStorage'
import { ArrowLeft, Camera, User as UserIcon, Save, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import './Settings.css'

export default function ProfileSettings() {
  const { user, refreshUser } = useAuth()
  const { colorScheme, setMode } = useThemeMode()
  const { t } = useLanguage()
  const { alert } = useDialog()
  const Colors = getColors(colorScheme)
  const navigate = useNavigate()
  const { pickImage, uploadImage, uploading } = useStorage()

  const [fullName, setFullName] = useState(user?.full_name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [location, setLocation] = useState(user?.location || '')
  const [isSaving, setIsSaving] = useState(false)
  const [avatarKey, setAvatarKey] = useState(0)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleSave = async () => {
    if (!user?.id) return

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone: phone || null,
          bio: bio || null,
          location: location || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) throw error
      await refreshUser()
      
      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
        navigate(-1)
      }, 1500)
    } catch (error: any) {
      alert(error.message || 'Failed to update profile', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarChange = async () => {
    try {
      const image = await pickImage()
      if (image && user?.id) {
        const uploadedUrl = await uploadImage(image, 'avatars')
        const { error } = await supabase
          .from('profiles')
          .update({ 
            avatar_url: uploadedUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id)

        if (error) throw error
        setAvatarKey(prev => prev + 1)
        await refreshUser()
        
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 2000)
      }
    } catch (error) {
      console.error('Error updating avatar:', error)
      alert('Failed to update profile picture', 'error')
    }
  }

  return (
    <div className="settings-container" style={{ backgroundColor: Colors.neutral[50] }}>
      {/* Header */}
      <div className="settings-header" style={{ 
        backgroundColor: Colors.white, 
        borderBottomColor: Colors.neutral[200] 
      }}>
        <button
          onClick={() => navigate(-1)}
          className="back-button"
        >
          <ArrowLeft size={24} color={Colors.neutral[700]} />
        </button>
        <h1 className="settings-header-title" style={{ color: Colors.neutral[900] }}>
          {t('profile.settings')}
        </h1>
      </div>

      {/* Profile Avatar Section */}
      <div className="avatar-section">
        <div className="avatar-card" style={{ 
          backgroundColor: Colors.white,
          borderColor: Colors.neutral[200]
        }}>
          <div className="avatar-wrapper">
            {user?.avatar_url ? (
              <img
                key={avatarKey}
                src={`${user.avatar_url}?t=${Date.now()}`}
                alt={user.full_name || ''}
                className="avatar-image"
                style={{ borderColor: Colors.primary[200] }}
              />
            ) : (
              <div 
                className="avatar-placeholder"
                style={{
                  backgroundColor: Colors.neutral[200],
                  borderColor: Colors.neutral[300],
                  color: Colors.neutral[500]
                }}
              >
                {user?.full_name?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
            <button
              onClick={handleAvatarChange}
              disabled={uploading}
              className="camera-button"
              style={{ backgroundColor: Colors.primary[700] }}
            >
              <Camera size={18} color="white" />
            </button>
          </div>

          <h2 className="avatar-name" style={{ color: Colors.neutral[900] }}>
            {user?.full_name || t('common.user')}
          </h2>
          <p className="avatar-email" style={{ color: Colors.neutral[600] }}>
            {user?.email}
          </p>
        </div>

        {/* Form Section */}
        <div className="form-section">
          <div className="form-card" style={{ 
            backgroundColor: Colors.white,
            borderColor: Colors.neutral[200]
          }}>
            <h3 className="form-section-title" style={{ color: Colors.neutral[900] }}>
              {t('profileForm.basicInformation')}
            </h3>

            <div className="form-group">
              <label className="form-label" style={{ color: Colors.neutral[700] }}>
                {t('profileForm.fullName')}
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="form-input"
                style={{
                  borderColor: Colors.neutral[300],
                  backgroundColor: Colors.white,
                  color: Colors.neutral[900]
                }}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ color: Colors.neutral[700] }}>
                {t('profileForm.phoneNumber')}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="form-input"
                style={{
                  borderColor: Colors.neutral[300],
                  backgroundColor: Colors.white,
                  color: Colors.neutral[900]
                }}
                placeholder="+237 6XX XXX XXX"
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ color: Colors.neutral[700] }}>
                {t('profileForm.location')}
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="form-input"
                style={{
                  borderColor: Colors.neutral[300],
                  backgroundColor: Colors.white,
                  color: Colors.neutral[900]
                }}
                placeholder="City, Country"
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ color: Colors.neutral[700] }}>
                {t('profileForm.bio')}
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="form-textarea"
                style={{
                  borderColor: Colors.neutral[300],
                  backgroundColor: Colors.white,
                  color: Colors.neutral[900]
                }}
                placeholder="Tell us about yourself..."
              />
            </div>

            <button
              onClick={handleSave}
              disabled={isSaving || uploading}
              className="save-button"
              style={{
                backgroundColor: (isSaving || uploading) ? Colors.neutral[400] : Colors.primary[700],
                color: Colors.white
              }}
            >
              <Save size={20} />
              {isSaving ? t('common.loading') : t('profile.updateProfile')}
            </button>
          </div>
        </div>
      </div>

      {/* Success Toast */}
      {showSuccess && (
        <div 
          className="success-toast"
          style={{
            backgroundColor: Colors.success[600],
            color: 'white'
          }}
        >
          <CheckCircle size={20} />
          <span>{t('profile.profileUpdated')}</span>
        </div>
      )}
    </div>
  )
}
