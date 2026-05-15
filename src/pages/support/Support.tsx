import React from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useThemeMode } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/I18nContext'
import { getColors } from '@/constants/Colors'
import { ArrowLeft, Mail, MessageCircle, Phone, ExternalLink, ChevronRight } from 'lucide-react'
import SEO from '@/components/SEO'

const SUPPORT_EMAIL = 'Propellacm@gmail.com'
const SUPPORT_PHONE_DISPLAY = '+237 672 239 591'
const SUPPORT_PHONE_E164 = '237672239591'
const SUPPORT_PHONE_TEL = `+${SUPPORT_PHONE_E164}`
const WHATSAPP_URL = `https://wa.me/${SUPPORT_PHONE_E164}`

export default function Support() {
  const { colorScheme } = useThemeMode()
  const { t, currentLanguage } = useLanguage()
  const Colors = getColors(colorScheme)
  const navigate = useNavigate()
  const lang = currentLanguage || 'en'

  const cardStyle: React.CSSProperties = {
    backgroundColor: Colors.white,
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '16px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
  }

  const contactRows: {
    icon: React.ReactNode
    title: string
    description: string
    href: string
    external?: boolean
  }[] = [
    {
      icon: <Mail size={22} />,
      title: t('supportPage.emailTitle'),
      description: SUPPORT_EMAIL,
      href: `mailto:${SUPPORT_EMAIL}`,
    },
    {
      icon: <Phone size={22} />,
      title: t('supportPage.phoneTitle'),
      description: SUPPORT_PHONE_DISPLAY,
      href: `tel:${SUPPORT_PHONE_TEL}`,
    },
    {
      icon: <MessageCircle size={22} />,
      title: t('supportPage.whatsappTitle'),
      description: t('supportPage.whatsappDescription'),
      href: WHATSAPP_URL,
      external: true,
    },
  ]

  const resourceLinks: { to: string; label: string; description: string }[] = [
    { to: '/faq', label: t('help.faq'), description: t('help.frequentlyAskedQuestions') },
    { to: '/terms', label: t('help.termsOfService'), description: t('help.readTermsOfService') },
    { to: '/privacy', label: t('help.privacyPolicy'), description: t('help.readPrivacyPolicy') },
  ]

  return (
    <div style={{ backgroundColor: Colors.neutral[50], minHeight: '100vh' }}>
      <SEO
        title={t('supportPage.metaTitle')}
        description={t('supportPage.metaDescription')}
        keywords={
          lang === 'fr'
            ? 'support Propella, aide Propella, contact Propella, immobilier Cameroun'
            : 'Propella support, Propella help, Propella contact, real estate Cameroon'
        }
        url="/support"
      />

      <div
        style={{
          backgroundColor: Colors.white,
          padding: '16px',
          borderBottom: `1px solid ${Colors.neutral[200]}`,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <ArrowLeft size={24} color={Colors.neutral[700]} />
        </button>
        <h1
          style={{
            fontSize: '20px',
            fontWeight: '600',
            color: Colors.neutral[900],
            margin: 0,
          }}
        >
          {t('supportPage.title')}
        </h1>
      </div>

      <div style={{ padding: '20px 16px', maxWidth: '800px', margin: '0 auto' }}>
        <p
          style={{
            fontSize: '15px',
            color: Colors.neutral[700],
            lineHeight: '24px',
            marginBottom: '20px',
          }}
        >
          {t('supportPage.intro')}
        </p>

        <h2
          style={{
            fontSize: '16px',
            fontWeight: '600',
            color: Colors.neutral[900],
            margin: '0 0 12px 4px',
          }}
        >
          {t('supportPage.contactHeading')}
        </h2>

        {contactRows.map((row) => (
          <a
            key={row.href}
            href={row.href}
            {...(row.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            style={{
              ...cardStyle,
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '12px',
                backgroundColor: Colors.primary[100],
                color: Colors.primary[700],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {row.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '16px', fontWeight: 600, color: Colors.neutral[900] }}>{row.title}</div>
              <div style={{ fontSize: '14px', color: Colors.neutral[600], marginTop: 4 }}>{row.description}</div>
            </div>
            {row.external ? <ExternalLink size={20} color={Colors.neutral[400]} /> : <ChevronRight size={20} color={Colors.neutral[400]} />}
          </a>
        ))}

        <div style={{ ...cardStyle, marginTop: '8px' }}>
          <h2
            style={{
              fontSize: '16px',
              fontWeight: '600',
              color: Colors.neutral[900],
              margin: '0 0 8px 0',
            }}
          >
            {t('supportPage.responseHeading')}
          </h2>
          <p style={{ fontSize: '15px', color: Colors.neutral[700], lineHeight: '22px', margin: 0 }}>
            {t('supportPage.responseBody')}
          </p>
        </div>

        <h2
          style={{
            fontSize: '16px',
            fontWeight: '600',
            color: Colors.neutral[900],
            margin: '24px 0 12px 4px',
          }}
        >
          {t('supportPage.resourcesHeading')}
        </h2>

        {resourceLinks.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            style={{
              ...cardStyle,
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '16px', fontWeight: 600, color: Colors.primary[700] }}>{item.label}</div>
              <div style={{ fontSize: '14px', color: Colors.neutral[600], marginTop: 4 }}>{item.description}</div>
            </div>
            <ChevronRight size={20} color={Colors.neutral[400]} />
          </Link>
        ))}
      </div>
    </div>
  )
}
