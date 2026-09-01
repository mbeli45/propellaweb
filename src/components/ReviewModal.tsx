import React, { useEffect, useState } from 'react'
import { Star, X } from 'lucide-react'
import { useLanguage } from '@/contexts/I18nContext'
import { useThemeMode } from '@/contexts/ThemeContext'
import { useDialog } from '@/contexts/DialogContext'
import { useBottomSheet } from '@/contexts/BottomSheetContext'
import { getColors } from '@/constants/Colors'
import { supabase } from '@/lib/supabase'
import { containsProfanity } from '@/utils/profanityFilter'

interface ReviewModalProps {
  visible: boolean
  reservation: any
  userId: string
  /** Called whether the review was submitted or declined - the visit is
      already complete by the time this modal opens, so both are valid exits. */
  onClose: (submitted: boolean) => void
}

/**
 * Rating step offered after a visit is completed. Mirrors the mobile modal in
 * app/(user)/reservations.tsx, including the upsert conflict targets, so a
 * review written on either platform is the same row.
 *
 * Completion is deliberately NOT performed here. It used to be on mobile, and
 * anyone who skipped the review left the visit incomplete and the agent's
 * share of the fee locked.
 */
export default function ReviewModal({ visible, reservation, userId, onClose }: ReviewModalProps) {
  const { colorScheme } = useThemeMode()
  const Colors = getColors(colorScheme)
  const { t } = useLanguage()
  const { alert } = useDialog()
  const { setBottomSheetOpen } = useBottomSheet()

  const [propertyRating, setPropertyRating] = useState(0)
  const [propertyComment, setPropertyComment] = useState('')
  const [agentRating, setAgentRating] = useState(0)
  const [agentComment, setAgentComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (visible) {
      document.body.style.overflow = 'hidden'
      setBottomSheetOpen(isMobile)
    } else {
      document.body.style.overflow = 'unset'
      setBottomSheetOpen(false)
    }
    return () => {
      document.body.style.overflow = 'unset'
      setBottomSheetOpen(false)
    }
  }, [visible, isMobile, setBottomSheetOpen])

  // Start clean for each reservation rather than carrying the last one's stars.
  useEffect(() => {
    if (visible) {
      setPropertyRating(0)
      setPropertyComment('')
      setAgentRating(0)
      setAgentComment('')
    }
  }, [visible, reservation?.id])

  if (!visible || !reservation) return null

  const handleSubmit = async () => {
    if (!userId) return

    // Instant feedback before submit; the database trigger from
    // 20260515120000_app_store_moderation.sql is the authoritative check.
    if (containsProfanity(propertyComment) || containsProfanity(agentComment)) {
      alert(t('moderation.prohibitedLanguage'), 'error', t('moderation.reportContent'))
      return
    }

    setSubmitting(true)
    try {
      const { error: propertyReviewError } = await supabase
        .from('property_reviews')
        .upsert({
          property_id: reservation.property_id,
          user_id: userId,
          reservation_id: reservation.id,
          rating: propertyRating,
          comment: propertyComment,
        }, { onConflict: 'property_id,user_id,reservation_id', ignoreDuplicates: true })

      if (propertyReviewError) throw new Error('Failed to submit property review')

      // Only agents and landlords are reviewable, so check the owner's role
      // before writing a row nothing will ever display.
      const propertyOwnerId = reservation.property?.owner_id
      if (propertyOwnerId && agentRating >= 1) {
        const { data: ownerProfile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', propertyOwnerId)
          .single()

        if (!profileError && (ownerProfile?.role === 'agent' || ownerProfile?.role === 'landlord')) {
          const { error: agentReviewError } = await supabase
            .from('agent_reviews')
            .upsert({
              agent_id: propertyOwnerId,
              user_id: userId,
              reservation_id: reservation.id,
              rating: agentRating,
              comment: agentComment,
            }, { onConflict: 'agent_id,user_id,reservation_id', ignoreDuplicates: true })

          // The property review is the one that matters; a failed agent review
          // should not discard it.
          if (agentReviewError) console.error('Agent review error:', agentReviewError)
        }
      }

      alert(t('reservations.reviewSubmittedMessage'), 'success', t('reservations.reviewSubmittedTitle'))
      onClose(true)
    } catch (error: any) {
      console.error('Review submission error:', error)
      alert(t('reservations.failedToSubmitReviewMessage'), 'error', t('reservations.errorTitle'))
    } finally {
      setSubmitting(false)
    }
  }

  const renderStars = (rating: number, setRating: (r: number) => void, label: string) => (
    <div style={{ display: 'flex', gap: '6px', margin: '8px 0 14px' }} role="radiogroup" aria-label={label}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => setRating(i)}
          aria-label={`${i}`}
          aria-checked={i === rating}
          role="radio"
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            lineHeight: 0,
          }}
        >
          <Star
            size={28}
            color={i <= rating ? Colors.primary[700] : Colors.neutral[300]}
            fill={i <= rating ? Colors.primary[700] : 'none'}
          />
        </button>
      ))}
    </div>
  )

  const inputStyle: React.CSSProperties = {
    width: '100%',
    minHeight: '84px',
    padding: '10px',
    borderRadius: '8px',
    border: `1px solid ${Colors.neutral[300]}`,
    fontSize: '14px',
    fontFamily: 'inherit',
    color: Colors.neutral[900],
    backgroundColor: colorScheme === 'dark' ? Colors.neutral[100] : Colors.white,
    resize: 'vertical',
    boxSizing: 'border-box',
  }

  const sectionStyle: React.CSSProperties = {
    fontSize: '15px',
    fontWeight: 600,
    color: Colors.neutral[900],
    marginTop: '4px',
  }

  return (
    <div
      onClick={() => !submitting && onClose(false)}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: isMobile ? 'flex-end' : 'center',
        justifyContent: 'center',
        padding: isMobile ? 0 : '24px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t('reservations.leaveReview')}
        style={{
          backgroundColor: Colors.white,
          borderRadius: isMobile ? '16px 16px 0 0' : '16px',
          padding: '20px',
          width: '100%',
          maxWidth: isMobile ? '100%' : '440px',
          // The sheet must not outgrow the viewport, and the body inside it is
          // the only part that scrolls. dvh tracks mobile browser chrome.
          maxHeight: '85dvh',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '4px',
        }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: 700,
            color: Colors.neutral[900],
            margin: 0,
          }}>
            {t('reservations.leaveReview')}
          </h2>
          <button
            type="button"
            onClick={() => onClose(false)}
            disabled={submitting}
            aria-label={t('reservations.skipReview')}
            style={{
              background: 'none',
              border: 'none',
              cursor: submitting ? 'not-allowed' : 'pointer',
              padding: '4px',
              lineHeight: 0,
            }}
          >
            <X size={20} color={Colors.neutral[600]} />
          </button>
        </div>

        <div style={{ overflowY: 'auto', minHeight: 0, paddingTop: '8px' }}>
          <div style={sectionStyle}>{t('reservations.propertyReview')}</div>
          {renderStars(propertyRating, setPropertyRating, t('reservations.propertyReview'))}
          <textarea
            style={inputStyle}
            placeholder={t('reservations.writePropertyComment')}
            value={propertyComment}
            onChange={(e) => setPropertyComment(e.target.value)}
          />

          <div style={{ ...sectionStyle, marginTop: '16px' }}>{t('reservations.agentReview')}</div>
          {renderStars(agentRating, setAgentRating, t('reservations.agentReview'))}
          <textarea
            style={inputStyle}
            placeholder={t('reservations.writeAgentComment')}
            value={agentComment}
            onChange={(e) => setAgentComment(e.target.value)}
          />
        </div>

        <div style={{ paddingTop: '16px' }}>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || propertyRating === 0}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: Colors.primary[600],
              color: Colors.white,
              fontSize: '15px',
              fontWeight: 600,
              cursor: submitting || propertyRating === 0 ? 'not-allowed' : 'pointer',
              opacity: submitting || propertyRating === 0 ? 0.5 : 1,
            }}
          >
            {submitting ? t('reservations.submitting') : t('reservations.submitReview')}
          </button>

          {/* Not "Cancel" - the visit is already complete; this only declines
              the review. */}
          <button
            type="button"
            onClick={() => onClose(false)}
            disabled={submitting}
            style={{
              width: '100%',
              marginTop: '8px',
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'transparent',
              color: Colors.neutral[600],
              fontSize: '14px',
              fontWeight: 500,
              cursor: submitting ? 'not-allowed' : 'pointer',
            }}
          >
            {t('reservations.skipReview')}
          </button>
        </div>
      </div>
    </div>
  )
}
