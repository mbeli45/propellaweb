import { useCallback, useMemo, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/I18nContext'
import { useThemeMode } from '@/contexts/ThemeContext'
import { getColors } from '@/constants/Colors'

/**
 * App Store guideline 1.2: existing users must accept the updated Terms of Use
 * (EULA) before continuing. Renders a blocking modal for signed-in users whose
 * profile has no eula_accepted_at timestamp.
 */
export default function EULAGate() {
  const { user, acceptEula, signOut } = useAuth()
  const { t } = useLanguage()
  const { colorScheme } = useThemeMode()
  const Colors = useMemo(() => getColors(colorScheme), [colorScheme])
  const [accepted, setAccepted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const needsAcceptance = !!user && !((user as any).eula_accepted_at)

  const handleAccept = useCallback(async () => {
    if (!accepted || submitting) return
    try {
      setSubmitting(true)
      setError(null)
      await acceptEula()
    } catch (e: any) {
      setError(e?.message || t('signup.mustAcceptTerms'))
    } finally {
      setSubmitting(false)
    }
  }, [accepted, submitting, acceptEula, t])

  if (!needsAcceptance) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        style={{
          backgroundColor: Colors.white,
          borderRadius: '16px',
          width: '100%',
          maxWidth: '480px',
          padding: '24px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <AlertTriangle size={22} color={Colors.primary[600]} />
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: Colors.neutral[900], margin: 0 }}>
            {t('signup.updatedTermsTitle')}
          </h2>
        </div>

        <div style={{ maxHeight: '240px', overflowY: 'auto', marginBottom: '12px' }}>
          <p style={{ fontSize: '14px', color: Colors.neutral[700], lineHeight: '20px', marginTop: 0 }}>
            {t('signup.updatedTermsBody')}
          </p>
          <p style={{ fontSize: '14px', color: Colors.neutral[700], lineHeight: '20px' }}>
            {t('moderation.zeroTolerance')}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <a
            href="/terms"
            target="_blank"
            rel="noreferrer"
            style={{
              fontSize: '13px',
              padding: '6px 10px',
              backgroundColor: Colors.primary[50],
              color: Colors.primary[600],
              borderRadius: '8px',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            {t('signup.termsOfService')}
          </a>
          <a
            href="/privacy"
            target="_blank"
            rel="noreferrer"
            style={{
              fontSize: '13px',
              padding: '6px 10px',
              backgroundColor: Colors.primary[50],
              color: Colors.primary[600],
              borderRadius: '8px',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            {t('signup.privacyPolicy')}
          </a>
        </div>

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', marginBottom: '12px' }}>
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: Colors.primary[600], cursor: 'pointer' }}
          />
          <span style={{ fontSize: '13px', color: Colors.neutral[800], lineHeight: '18px' }}>
            {t('signup.eulaAgreement')}
          </span>
        </label>

        {error ? (
          <div style={{ color: Colors.error[600], fontSize: '13px', marginBottom: '12px' }}>{error}</div>
        ) : null}

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
          <button
            type="button"
            onClick={() => signOut()}
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
            {t('auth.signOut')}
          </button>
          <button
            type="button"
            onClick={handleAccept}
            disabled={!accepted || submitting}
            style={{
              flex: 1,
              padding: '10px 18px',
              borderRadius: '10px',
              backgroundColor: !accepted || submitting ? Colors.neutral[300] : Colors.primary[600],
              color: Colors.white,
              fontWeight: 700,
              border: 'none',
              cursor: !accepted || submitting ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting ? t('moderation.submitting') : t('signup.acceptToContinue')}
          </button>
        </div>
      </div>
    </div>
  )
}
