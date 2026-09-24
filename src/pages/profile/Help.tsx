import { useNavigate } from 'react-router-dom'
import { FileText, Globe, HelpCircle, Mail, Phone, Shield } from 'lucide-react'
import { useLanguage } from '@/contexts/I18nContext'
import { PageHeader, ReservationsPage, SettingsGroup, SettingsRow } from '@/components/reservations/ReservationUI'

const SUPPORT_EMAIL = 'Propellacm@gmail.com'
const SUPPORT_PHONE = '+237672239591'
const SUPPORT_PHONE_LABEL = '+237 672 239 591'

export default function ProfileHelp() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const version = import.meta.env.VITE_APP_VERSION as string | undefined

  return (
    <ReservationsPage narrow label={t('help.helpAndSupport')}>
      <PageHeader
        title={t('help.helpAndSupport')}
        subtitle={t('profileMenu.helpSubtitle')}
        onBack={() => navigate(-1)}
        backLabel={t('common.back')}
      />

      <SettingsGroup title={t('profileMenu.contact')}>
        <SettingsRow icon={Mail} label={t('profileMenu.emailSupport')} detail={SUPPORT_EMAIL} href={`mailto:${SUPPORT_EMAIL}`} />
        <SettingsRow icon={Phone} label={t('help.callSupport')} detail={SUPPORT_PHONE_LABEL} href={`tel:${SUPPORT_PHONE}`} />
      </SettingsGroup>

      <SettingsGroup title={t('profileMenu.resources')}>
        <SettingsRow icon={Globe} label={t('help.supportCenter')} onClick={() => navigate('/support')} />
        <SettingsRow icon={HelpCircle} label={t('help.faq')} onClick={() => navigate('/faq')} />
        <SettingsRow icon={FileText} label={t('help.termsOfService')} onClick={() => navigate('/terms')} />
        <SettingsRow icon={Shield} label={t('help.privacyPolicy')} onClick={() => navigate('/privacy')} />
      </SettingsGroup>

      {version && <p className="ds-set-note">Propella · {t('profileMenu.version', { version })}</p>}
    </ReservationsPage>
  )
}
