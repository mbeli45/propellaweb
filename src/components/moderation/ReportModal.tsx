import { useCallback, useMemo, useState } from 'react'
import { Flag, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/I18nContext'
import { useThemeMode } from '@/contexts/ThemeContext'
import { getColors } from '@/constants/Colors'
import { useModeration, ReportContentType, ReportReason } from '@/hooks/useModeration'

interface ReportModalProps {
  open: boolean
  onClose: () => void
  contentType: ReportContentType
  contentId?: string | null
  reportedUserId?: string | null
  title?: string
}

const REASONS: { key: ReportReason; tKey: string }[] = [
  { key: 'spam', tKey: 'moderation.reasonSpam' },
  { key: 'harassment', tKey: 'moderation.reasonHarassment' },
  { key: 'sexual', tKey: 'moderation.reasonSexual' },
  { key: 'violence', tKey: 'moderation.reasonViolence' },
  { key: 'scam', tKey: 'moderation.reasonScam' },
  { key: 'fake_listing', tKey: 'moderation.reasonFakeListing' },
  { key: 'impersonation', tKey: 'moderation.reasonImpersonation' },
  { key: 'other', tKey: 'moderation.reasonOther' },
]

export default function ReportModal({ open, onClose, contentType, contentId, reportedUserId, title }: ReportModalProps) {
  const { t } = useLanguage()
  const { colorScheme } = useThemeMode()
  const Colors = useMemo(() => getColors(colorScheme), [colorScheme])
  const { submitReport } = useModeration()
  const { user } = useAuth()

  const [reason, setReason] = useState<ReportReason | null>(null)
  const [details, setDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const computedTitle = useMemo(() => {
    if (title) return title
    switch (contentType) {
      case 'property':
        return t('moderation.reportProperty')
      case 'message':
        return t('moderation.reportMessage')
      case 'review':
        return t('moderation.reportReview')
      case 'profile':
        return t('moderation.reportUser')
      default:
        return t('moderation.reportContent')
    }
  }, [contentType, title, t])

  const reset = useCallback(() => {
    setReason(null)
    setDetails('')
    setSubmitting(false)
    setSuccess(false)
    setError(null)
  }, [])

  const handleClose = useCallback(() => {
    reset()
    onClose()
  }, [onClose, reset])

  const handleSubmit = useCallback(async () => {
    if (!reason || submitting) return
    if (!user) {
      setError(t('moderation.reportFailed'))
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      await submitReport({
        contentType,
        contentId,
        reportedUserId,
        reason,
        details: details.trim() || undefined,
      })
      setSuccess(true)
      setTimeout(handleClose, 1600)
    } catch (e: any) {
      setError(e?.message || t('moderation.reportFailed'))
    } finally {
      setSubmitting(false)
    }
  }, [reason, submitting, user, submitReport, contentType, contentId, reportedUserId, details, handleClose, t])

  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={handleClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: Colors.white,
          borderRadius: '16px',
          width: '100%',
          maxWidth: '480px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '20px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <Flag size={20} color={Colors.primary[600]} />
          <h2 style={{ flex: 1, margin: 0, fontSize: '18px', fontWeight: 600, color: Colors.neutral[900] }}>
            {computedTitle}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px' }}
          >
            <X size={20} color={Colors.neutral[600]} />
          </button>
        </div>

        <p style={{ fontSize: '14px', fontWeight: 600, color: Colors.neutral[800], marginBottom: '10px' }}>
          {t('moderation.selectReason')}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
          {REASONS.map((r) => {
            const selected = reason === r.key
            return (
              <button
                key={r.key}
                type="button"
                onClick={() => setReason(r.key)}
                style={{
                  textAlign: 'left',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: `1px solid ${selected ? Colors.primary[500] : Colors.neutral[200]}`,
                  backgroundColor: selected ? Colors.primary[50] : Colors.neutral[50],
                  color: selected ? Colors.primary[700] : Colors.neutral[800],
                  fontWeight: selected ? 600 : 400,
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                {t(r.tKey)}
              </button>
            )
          })}
        </div>

        <p style={{ fontSize: '14px', fontWeight: 600, color: Colors.neutral[800], marginBottom: '6px' }}>
          {t('moderation.additionalDetails')}
        </p>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          maxLength={1000}
          placeholder={t('moderation.detailsPlaceholder')}
          style={{
            width: '100%',
            minHeight: '90px',
            padding: '12px',
            borderRadius: '10px',
            border: `1px solid ${Colors.neutral[200]}`,
            backgroundColor: Colors.neutral[50],
            color: Colors.neutral[900],
            fontSize: '14px',
            resize: 'vertical',
            fontFamily: 'inherit',
          }}
        />

        <p style={{ fontSize: '12px', color: Colors.neutral[500], marginTop: '10px' }}>
          {t('moderation.zeroTolerance')}
        </p>

        {success && (
          <div
            style={{
              marginTop: '12px',
              padding: '10px 12px',
              borderRadius: '8px',
              backgroundColor: Colors.success[50],
              color: Colors.success[700],
              fontSize: '13px',
            }}
          >
            {t('moderation.reportSubmitted')}
          </div>
        )}
        {error && (
          <div
            style={{
              marginTop: '12px',
              padding: '10px 12px',
              borderRadius: '8px',
              backgroundColor: Colors.error[50],
              color: Colors.error[700],
              fontSize: '13px',
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '18px' }}>
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              backgroundColor: Colors.neutral[100],
              color: Colors.neutral[700],
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {t('moderation.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!reason || submitting}
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              backgroundColor: !reason || submitting ? Colors.neutral[300] : Colors.primary[600],
              color: Colors.white,
              fontWeight: 700,
              border: 'none',
              cursor: !reason || submitting ? 'not-allowed' : 'pointer',
              minWidth: '140px',
            }}
          >
            {submitting ? t('moderation.submitting') : t('moderation.submit')}
          </button>
        </div>
      </div>
    </div>
  )
}
