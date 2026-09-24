import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useThemeMode } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/I18nContext'
import { getColors } from '@/constants/Colors'
import { useAgentVerification } from '@/hooks/useAgentVerification'
import { Award, Building, CheckCircle, Clock, Shield, Star, Upload } from 'lucide-react'
import { useStorage } from '@/hooks/useStorage'
import './Verification.css'
import { FormSkeleton } from '@/components/skeletons'
import { CardButton, PageHeader, ReservationsPage, SettingsGroup, SettingsRow } from '@/components/reservations/ReservationUI'

export default function ProfileVerification() {
  const { user } = useAuth()
  const { colorScheme } = useThemeMode()
  const { t } = useLanguage()
  const Colors = getColors(colorScheme)
  const navigate = useNavigate()
  const { pickImage, uploadImage, uploading } = useStorage()

  // Check if user is an agent - redirect if not
  useEffect(() => {
    if (user && user.role !== 'agent') {
      navigate(-1)
    }
  }, [user, navigate])

  const {
    verification,
    loading,
    error,
    initializeVerification,
    uploadVerificationDocument,
    submitForReview,
    fetchVerification,
    verificationChecklist,
    isVerificationComplete,
    canSubmitForReview,
  } = useAgentVerification(user?.id)

  const [showInitForm, setShowInitForm] = useState(false)
  const [selectedDocumentType, setSelectedDocumentType] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    businessName: '',
    businessAddress: '',
    yearsOfExperience: '',
  })

  // No need for this useEffect - the hook already fetches on mount via useAgentVerification(user?.id)
  // useEffect(() => {
  //   if (user?.id && user?.role === 'agent') {
  //     fetchVerification()
  //   }
  // }, [user?.id, user?.role, fetchVerification])

  // Don't render anything if not an agent
  if (!user || user.role !== 'agent') {
    return null
  }

  const handleInitialize = async () => {
    if (!user?.id) return
    
    try {
      const success = await initializeVerification(
        user.id,
        formData.businessName,
        formData.businessAddress,
        parseInt(formData.yearsOfExperience) || 0,
        [] // specializations - empty array for now
      )
      if (success) {
        setShowInitForm(false)
      }
    } catch (error) {
      console.error('Error initializing verification:', error)
    }
  }

  const handleDocumentUpload = async (documentType: string) => {
    if (!verification?.id) return
    
    try {
      const file = await pickImage() as File | null
      if (file) {
        // Upload the file first using uploadImage
        const uploadResult = await uploadImage(file, 'verification')
        if (uploadResult?.url) {
          // Then update the verification record with the URL
          await uploadVerificationDocument(
            documentType as 'business_license' | 'professional_certificate' | 'id_document_front' | 'id_document_back' | 'proof_of_address',
            uploadResult.url,
            file.name,
            verification.id
          )
        }
      }
    } catch (error) {
      console.error('Error uploading document:', error)
    }
  }

  if (loading) {
    return <FormSkeleton fields={4} />
  }

  // Where the agent is: started -> fee paid -> under review -> verified.
  const STEPS = 4
  const status = verification?.verification_status
  const step = !verification ? 0 : status === 'approved' ? 4 : status === 'documents_review' ? 3 : verification.verification_fee_paid ? 2 : 1
  const statusKey = !verification ? 'not_started' : status
  const tone =
    statusKey === 'approved'
      ? { bg: 'var(--rsv-success-tint)', text: 'var(--rsv-success-ink)', dot: 'var(--rsv-success)' }
      : statusKey === 'rejected'
        ? { bg: 'var(--rsv-error-tint)', text: 'var(--rsv-error-ink)', dot: 'var(--rsv-error)' }
        : statusKey === 'documents_review'
          ? { bg: 'var(--rsv-primary-tint)', text: 'var(--rsv-primary-ink)', dot: 'var(--rsv-primary)' }
          : statusKey === 'pending'
            ? { bg: 'var(--rsv-warning-tint)', text: 'var(--rsv-warning-ink)', dot: 'var(--rsv-warning)' }
            : { bg: 'var(--rsv-line-soft)', text: 'var(--rsv-ink-2)', dot: 'var(--rsv-faint)' }
  const statusLabel =
    statusKey === 'approved'
      ? t('verificationUI.statusApproved')
      : statusKey === 'rejected'
        ? t('verificationUI.statusRejected')
        : statusKey === 'documents_review'
          ? t('verificationUI.statusReview')
          : statusKey === 'pending'
            ? t('verificationUI.statusPending')
            : t('verificationUI.statusNotStarted')

  return (
    <ReservationsPage narrow label={t('sharedProfile.agentVerification')}>
      <PageHeader
        title={t('sharedProfile.agentVerification')}
        subtitle={t('verificationUI.subtitle')}
        onBack={() => navigate(-1)}
        backLabel={t('common.back')}
      />

      {/* Status: pill, progress, and the one next step */}
      <section className="vf-status" aria-label={statusLabel}>
        <div className="vf-status-top">
          <span className="vf-pill" style={{ background: tone.bg, color: tone.text }}>
            <span className="rsv-dot" style={{ background: tone.dot }} />
            {statusLabel}
          </span>
          <span className="vf-step">{t('verificationUI.stepOf', { step, total: STEPS })}</span>
        </div>
        <div className="vf-track" role="progressbar" aria-valuemin={0} aria-valuemax={STEPS} aria-valuenow={step}>
          {Array.from({ length: STEPS }, (_, index) => (
            <span key={index} className={index < step ? 'is-done' : undefined} />
          ))}
        </div>
        {!verification && !showInitForm && (
          <>
            <p className="vf-text">{t('verification.oneTimeVerificationFee')}</p>
            <CardButton label={t('verificationUI.start')} icon={Shield} tone="primary" onClick={() => setShowInitForm(true)} block />
          </>
        )}
        {canSubmitForReview && verification?.id && (
          <CardButton label={t('verificationUI.submit')} icon={CheckCircle} tone="primary" onClick={() => submitForReview(verification.id)} block />
        )}
      </section>

      {error && <p className="vf-error" role="alert">{error}</p>}

      {showInitForm && (
        <form
          className="vf-form"
          onSubmit={(e) => {
            e.preventDefault()
            handleInitialize()
          }}
        >
          <h2 className="ds-set-title">{t('verification.businessInformation')}</h2>
          <label className="vf-field">
            <span>{t('form.realEstateBusinessName')}</span>
            <input type="text" value={formData.businessName} onChange={(e) => setFormData((prev) => ({ ...prev, businessName: e.target.value }))} required />
          </label>
          <label className="vf-field">
            <span>{t('form.businessAddress')}</span>
            <input type="text" value={formData.businessAddress} onChange={(e) => setFormData((prev) => ({ ...prev, businessAddress: e.target.value }))} required />
          </label>
          <label className="vf-field">
            <span>{t('form.yearsOfExperience')}</span>
            <input type="number" min="0" value={formData.yearsOfExperience} onChange={(e) => setFormData((prev) => ({ ...prev, yearsOfExperience: e.target.value }))} required />
          </label>
          <div className="vf-actions">
            <CardButton label={t('common.cancel')} tone="neutral" onClick={() => setShowInitForm(false)} />
            <button type="submit" className="rsv-btn rsv-btn--primary">{t('verification.initializeVerification')}</button>
          </div>
        </form>
      )}

      {verification && verificationChecklist && (
        <SettingsGroup title={t('verificationUI.checklist')}>
          {verificationChecklist.map((item: any) => (
            <SettingsRow
              key={item.id}
              icon={item.completed ? CheckCircle : Clock}
              label={item.title}
              detail={item.completed ? t('verificationUI.done') : item.required ? t('verificationUI.required') : undefined}
              right={
                !item.completed && item.id !== 'verification_fee' ? (
                  <button type="button" className="vf-upload" onClick={() => handleDocumentUpload(item.id)} disabled={uploading}>
                    <Upload size={15} aria-hidden="true" />
                    {uploading ? t('common.uploading') : t('verificationUI.upload')}
                  </button>
                ) : undefined
              }
            />
          ))}
        </SettingsGroup>
      )}

      <SettingsGroup title={t('verificationUI.whyVerify')}>
        <SettingsRow icon={Shield} label={t('verificationUI.benefitBadge')} />
        <SettingsRow icon={Star} label={t('verificationUI.benefitRanking')} />
        <SettingsRow icon={Award} label={t('verificationUI.benefitFeatures')} />
        <SettingsRow icon={Building} label={t('verificationUI.benefitSupport')} />
      </SettingsGroup>

      <SettingsGroup title={t('verificationUI.badgeLevels')}>
        <SettingsRow icon={Award} label={t('verificationUI.bronze')} detail={t('verificationUI.bronzeReq')} />
        <SettingsRow icon={Award} label={t('verificationUI.silver')} detail={t('verificationUI.silverReq')} />
        <SettingsRow icon={Award} label={t('verificationUI.gold')} detail={t('verificationUI.goldReq')} />
        <SettingsRow icon={Award} label={t('verificationUI.platinum')} detail={t('verificationUI.platinumReq')} />
      </SettingsGroup>
    </ReservationsPage>
  )
}
