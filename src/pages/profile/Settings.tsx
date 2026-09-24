import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/I18nContext'
import { useDialog } from '@/contexts/DialogContext'
import { useStorage } from '@/hooks/useStorage'
import { Camera, CheckCircle, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { PageHeader, ReservationsPage } from '@/components/reservations/ReservationUI'
import './Settings.css'

export default function ProfileSettings() {
  const { user, refreshUser } = useAuth()
  const { t } = useLanguage()
  const { alert } = useDialog()
  const navigate = useNavigate()
  const { pickImage, uploadImage, uploading } = useStorage()

  const [fullName, setFullName] = useState(user?.full_name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [location, setLocation] = useState(user?.location || '')
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault()
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
      const picked = await pickImage()
      const file = Array.isArray(picked) ? picked[0] : picked
      if (!file || !user?.id) return
      const uploaded = await uploadImage(file, 'avatars')
      if (!uploaded?.url) throw new Error('upload failed')
      const { error } = await supabase
        .from('profiles')
        .update({
          avatar_url: uploaded.url,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error
      await refreshUser()

      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 2000)
    } catch (error) {
      console.error('Error updating avatar:', error)
      alert('Failed to update profile picture', 'error')
    }
  }

  const name = user?.full_name || t('common.user')

  return (
    <ReservationsPage narrow label={t('profile.personalInformation')}>
      <PageHeader
        title={t('profile.personalInformation')}
        subtitle={t('profileMenu.personalInfoSubtitle')}
        onBack={() => navigate(-1)}
        backLabel={t('common.back')}
      />

      <div className="ps-photo">
        <button
          type="button"
          className="ds-identity-avatar ps-avatar"
          onClick={handleAvatarChange}
          disabled={uploading}
          aria-label={t('profileMenu.changePhoto')}
        >
          {user?.avatar_url ? <img src={user.avatar_url} alt="" /> : name.charAt(0).toUpperCase()}
          <span className="ds-identity-camera" aria-hidden="true">
            {uploading ? <Loader2 size={13} className="ps-spin" /> : <Camera size={13} />}
          </span>
        </button>
        <button type="button" className="ps-link" onClick={handleAvatarChange} disabled={uploading}>
          {t('profileMenu.changePhoto')}
        </button>
      </div>

      <form className="ps-form" onSubmit={handleSave}>
        <h2 className="ds-set-title">{t('profileForm.basicInformation')}</h2>

        <label className="ps-field">
          <span>{t('profileForm.fullName')}</span>
          <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" />
        </label>

        <label className="ps-field">
          <span>{t('profileForm.phoneNumber')}</span>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+237 6XX XXX XXX" autoComplete="tel" />
        </label>

        <label className="ps-field">
          <span>{t('profileForm.location')}</span>
          <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, Country" />
        </label>

        <label className="ps-field">
          <span>{t('profileForm.bio')}</span>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} placeholder="Tell us about yourself..." />
        </label>

        <button type="submit" className="rsv-btn rsv-btn--primary ps-save" disabled={isSaving || uploading}>
          {isSaving && <Loader2 size={16} className="ps-spin" />}
          {isSaving ? t('buttons.saving') : t('buttons.saveChanges')}
        </button>
      </form>

      {showSuccess && (
        <div className="ds-toast" role="status" style={{ background: 'var(--color-success-600, #059669)' }}>
          <CheckCircle size={16} style={{ verticalAlign: '-3px', marginRight: 6 }} />
          {t('profile.profileUpdated')}
        </div>
      )}
    </ReservationsPage>
  )
}
