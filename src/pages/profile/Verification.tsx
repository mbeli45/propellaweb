import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useThemeMode } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/I18nContext'
import { getColors } from '@/constants/Colors'
import { useAgentVerification } from '@/hooks/useAgentVerification'
import { ArrowLeft, Shield, CheckCircle, Clock, XCircle, Upload, Eye, Trash2, CreditCard } from 'lucide-react'
import { useStorage } from '@/hooks/useStorage'
import './Verification.css'

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle size={20} color={Colors.success[600]} />
      case 'pending':
        return <Clock size={20} color={Colors.warning[600]} />
      case 'rejected':
        return <XCircle size={20} color={Colors.error[600]} />
      default:
        return <Clock size={20} color={Colors.neutral[400]} />
    }
  }

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

  return (
    <div className="verification-container" style={{ backgroundColor: Colors.neutral[50], minHeight: '100vh' }}>
      {/* Header */}
      <div style={{
        backgroundColor: Colors.white,
        padding: '16px',
        borderBottom: `1px solid ${Colors.neutral[200]}`,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <ArrowLeft size={24} color={Colors.neutral[700]} />
        </button>
        <h1 style={{
          fontSize: '20px',
          fontWeight: '600',
          color: Colors.neutral[900],
          margin: 0
        }}>
          {t('profile.verification')}
        </h1>
      </div>

      <div style={{ padding: '20px 16px' }}>
        {!verification && (
          <div style={{
            backgroundColor: Colors.white,
            borderRadius: '12px',
            padding: '24px',
            textAlign: 'center',
            marginBottom: '20px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
          }}>
            <Shield size={48} color={Colors.primary[600]} style={{ marginBottom: '16px' }} />
            <h2 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: Colors.neutral[900],
              marginBottom: '8px'
            }}>
              {t('verification.startVerificationProcess')}
            </h2>
            <p style={{
              fontSize: '14px',
              color: Colors.neutral[600],
              marginBottom: '20px'
            }}>
              {t('verification.oneTimeVerificationFee')}
            </p>
            <button
              onClick={() => setShowInitForm(true)}
              style={{
                padding: '12px 24px',
                backgroundColor: Colors.primary[600],
                color: Colors.white,
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {t('verification.initializeVerification')}
            </button>
          </div>
        )}

        {showInitForm && (
          <div style={{
            backgroundColor: Colors.white,
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: Colors.neutral[900],
              marginBottom: '16px'
            }}>
              {t('verification.businessInformation')}
            </h3>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: Colors.neutral[700],
                marginBottom: '8px'
              }}>
                {t('form.realEstateBusinessName')}
              </label>
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `1px solid ${Colors.neutral[300]}`,
                  backgroundColor: Colors.white,
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: Colors.neutral[900],
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: Colors.neutral[700],
                marginBottom: '8px'
              }}>
                {t('form.businessAddress')}
              </label>
              <input
                type="text"
                value={formData.businessAddress}
                onChange={(e) => setFormData(prev => ({ ...prev, businessAddress: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `1px solid ${Colors.neutral[300]}`,
                  backgroundColor: Colors.white,
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: Colors.neutral[900],
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: Colors.neutral[700],
                marginBottom: '8px'
              }}>
                {t('form.yearsOfExperience')}
              </label>
              <input
                type="number"
                value={formData.yearsOfExperience}
                onChange={(e) => setFormData(prev => ({ ...prev, yearsOfExperience: e.target.value }))}
                min="0"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `1px solid ${Colors.neutral[300]}`,
                  backgroundColor: Colors.white,
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: Colors.neutral[900],
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowInitForm(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: Colors.neutral[200],
                  color: Colors.neutral[700],
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleInitialize}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: Colors.primary[600],
                  color: Colors.white,
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                {t('verification.initializeVerification')}
              </button>
            </div>
          </div>
        )}

        {verification && (
          <div>
            <div style={{
              backgroundColor: Colors.white,
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '20px',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px'
              }}>
                {getStatusIcon(verification.status || 'pending')}
                <div>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: Colors.neutral[900],
                    margin: 0
                  }}>
                    {t('verification.verificationProgress')}
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: Colors.neutral[600],
                    margin: 0
                  }}>
                    Status: {verification.status || 'pending'}
                  </p>
                </div>
              </div>

              {verificationChecklist && (
                <div>
                  {verificationChecklist.map((item: any) => (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px',
                        marginBottom: '8px',
                        backgroundColor: Colors.neutral[50],
                        borderRadius: '8px'
                      }}
                    >
                      <span style={{
                        fontSize: '14px',
                        color: Colors.neutral[700]
                      }}>
                        {item.title}
                      </span>
                      {item.completed ? (
                        <CheckCircle size={20} color={Colors.success[600]} />
                      ) : (
                        <button
                          onClick={() => handleDocumentUpload(item.id)}
                          disabled={uploading}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: Colors.primary[600],
                            color: Colors.white,
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '500',
                            cursor: uploading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            opacity: uploading ? 0.6 : 1
                          }}
                        >
                          <Upload size={14} />
                          {uploading ? t('common.uploading') : t('common.upload')}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {canSubmitForReview && verification?.id && (
                <button
                  onClick={() => submitForReview(verification.id)}
                  style={{
                    width: '100%',
                    marginTop: '16px',
                    padding: '12px',
                    backgroundColor: Colors.primary[600],
                    color: Colors.white,
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {t('verification.submitForReview')}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
