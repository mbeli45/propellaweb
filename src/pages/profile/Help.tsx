import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useThemeMode } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/I18nContext'
import { getColors } from '@/constants/Colors'
import { ArrowLeft, MessageCircle, Phone, Mail, FileText, Globe, ChevronRight } from 'lucide-react'
import './Help.css'

export default function ProfileHelp() {
  const { colorScheme } = useThemeMode()
  const { t } = useLanguage()
  const Colors = getColors(colorScheme)
  const navigate = useNavigate()

  const handleContactSupport = () => {
    window.location.href = 'mailto:Propellacm@gmail.com'
  }

  const handleCallSupport = () => {
    window.location.href = 'tel:+237672239591'
  }

  const menuItems = [
    {
      icon: <MessageCircle size={24} />,
      title: t('help.contactUs'),
      description: t('help.getHelpFromSupport'),
      action: handleContactSupport,
    },
    {
      icon: <Phone size={24} />,
      title: t('help.callSupport'),
      description: '+237 672 239 591',
      action: handleCallSupport,
    },
    {
      icon: <FileText size={24} />,
      title: t('help.faq'),
      description: t('help.frequentlyAskedQuestions'),
      action: () => navigate('/faq'),
    },
    {
      icon: <Globe size={24} />,
      title: t('help.termsOfService'),
      description: t('help.readTermsOfService'),
      action: () => navigate('/terms'),
    },
    {
      icon: <Globe size={24} />,
      title: t('help.privacyPolicy'),
      description: t('help.readPrivacyPolicy'),
      action: () => navigate('/privacy'),
    },
  ]

  const getIconConfig = (index: number) => {
    const configs = [
      { bg: Colors.primary[100], color: Colors.primary[700] },
      { bg: Colors.success[100], color: Colors.success[700] },
      { bg: Colors.warning[100], color: Colors.warning[700] },
      { bg: Colors.neutral[100], color: Colors.neutral[700] },
      { bg: Colors.neutral[100], color: Colors.neutral[700] },
    ]
    return configs[index] || configs[0]
  }

  return (
    <div className="help-container" style={{ backgroundColor: Colors.neutral[50] }}>
      {/* Header */}
      <div className="help-header" style={{
        backgroundColor: Colors.white,
        borderBottomColor: Colors.neutral[200]
      }}>
        <button
          onClick={() => navigate(-1)}
          className="back-button"
        >
          <ArrowLeft size={24} color={Colors.neutral[700]} />
        </button>
        <h1 className="help-header-title" style={{ color: Colors.neutral[900] }}>
          {t('profile.help')}
        </h1>
      </div>

      <div className="help-section">
        <div className="help-card" style={{ backgroundColor: Colors.white }}>
          {menuItems.map((item, index) => {
            const iconConfig = getIconConfig(index)
            return (
              <button
                key={index}
                onClick={item.action}
                className="help-item"
                style={{ borderBottomColor: Colors.neutral[200] }}
              >
                <div className="help-item-left">
                  <div 
                    className="help-icon-wrapper" 
                    style={{ backgroundColor: iconConfig.bg }}
                  >
                    {React.cloneElement(item.icon, { color: iconConfig.color })}
                  </div>
                  <div className="help-item-text">
                    <div className="help-item-title" style={{ color: Colors.neutral[900] }}>
                      {item.title}
                    </div>
                    <div className="help-item-description" style={{ color: Colors.neutral[600] }}>
                      {item.description}
                    </div>
                  </div>
                </div>
                <ChevronRight size={20} color={Colors.neutral[400]} />
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
