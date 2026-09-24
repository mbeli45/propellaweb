import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, KeyRound, Mail } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/I18nContext'
import { PageHeader, ReservationsPage, SettingsGroup, SettingsRow } from '@/components/reservations/ReservationUI'

export default function ProfileSecurity() {
  const { user, forgotPassword } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleChangePassword = async () => {
    if (!user?.email) return
    setSending(true)
    try {
      await forgotPassword(user.email)
      setMessage({ type: 'success', text: t('profileMenu.resetLinkSent', { email: user.email }) })
    } catch {
      setMessage({ type: 'error', text: t('profileMenu.resetLinkFailed') })
    } finally {
      setSending(false)
      setTimeout(() => setMessage(null), 5000)
    }
  }

  return (
    <ReservationsPage narrow label={t('profileMenu.securityPrivacy')}>
      <PageHeader
        title={t('profileMenu.securityPrivacy')}
        subtitle={t('profileMenu.securitySubtitle')}
        onBack={() => navigate(-1)}
        backLabel={t('common.back')}
      />

      <SettingsGroup title={t('profileMenu.signIn')}>
        <SettingsRow icon={Mail} label={t('profileMenu.email')} value={user?.email || '—'} />
        <SettingsRow
          icon={KeyRound}
          label={t('profileMenu.changePassword')}
          detail={t('profileMenu.changePasswordDetail')}
          onClick={user?.email ? handleChangePassword : undefined}
          disabled={sending}
        />
      </SettingsGroup>

      <SettingsGroup title={t('profileMenu.privacy')} footer={t('profileMenu.privacyNote')}>
        <SettingsRow icon={FileText} label={t('help.privacyPolicy')} onClick={() => navigate('/privacy')} />
      </SettingsGroup>

      {message && (
        <div
          className="ds-toast"
          role={message.type === 'error' ? 'alert' : 'status'}
          style={{ background: message.type === 'success' ? 'var(--color-success-600, #059669)' : 'var(--color-error-600, #dc2626)' }}
        >
          {message.text}
        </div>
      )}
    </ReservationsPage>
  )
}
