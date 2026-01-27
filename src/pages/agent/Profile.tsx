import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useThemeMode } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/I18nContext'
import { getColors } from '@/constants/Colors'
import { 
  Settings, 
  Shield, 
  HelpCircle, 
  ChevronRight, 
  BarChart3,
  User as UserIcon, 
  Camera, 
  Sun, 
  Moon, 
  Monitor, 
  Bell,
  Lock,
  Languages,
  LogOut,
  Trash2
} from 'lucide-react'
import '../user/Profile.css'

export default function AgentProfile() {
  const { user, signOut } = useAuth()
  const { colorScheme, setMode, mode } = useThemeMode()
  const { t, changeLanguage, currentLanguage } = useLanguage()
  const Colors = getColors(colorScheme)
  const navigate = useNavigate()

  const [showLanguageModal, setShowLanguageModal] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleLanguageSelect = async (language: 'en' | 'fr') => {
    try {
      await changeLanguage(language)
      setShowLanguageModal(false)
      setMessage({ 
        type: 'success', 
        text: language === 'en' ? 'Language changed to English' : 'Langue changée en français' 
      })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: language === 'en' ? 'Failed to change language' : 'Échec du changement de langue' 
      })
      setTimeout(() => setMessage(null), 5000)
    }
  }

  const themeOptions = [
    { label: 'Light', value: 'light', icon: Sun },
    { label: 'Dark', value: 'dark', icon: Moon },
    { label: 'Auto', value: 'auto', icon: Monitor },
  ]

  const menuItems = [
    {
      icon: <UserIcon size={20} color={Colors.primary[600]} />,
      title: t('profile.settings'),
      description: 'Update your profile information',
      onClick: () => navigate('/agent/profile/settings')
    },
    {
      icon: <BarChart3 size={20} color={Colors.success[600]} />,
      title: 'Analytics',
      description: 'View your property analytics',
      onClick: () => navigate('/agent/analytics')
    },
    {
      icon: <Shield size={20} color={Colors.success[600]} />,
      title: t('profile.verification'),
      description: 'Verify your agent credentials',
      onClick: () => navigate('/agent/profile/verification')
    },
    {
      icon: <Bell size={20} color={Colors.warning[600]} />,
      title: 'Notifications',
      description: 'Manage notification preferences',
      onClick: () => setNotificationsEnabled(!notificationsEnabled),
      isToggle: true
    },
    {
      icon: <Languages size={20} color={Colors.neutral[600]} />,
      title: t('profile.language'),
      description: currentLanguage === 'en' ? 'English' : 'Français',
      onClick: () => setShowLanguageModal(true)
    },
    {
      icon: <Lock size={20} color={Colors.neutral[600]} />,
      title: t('profile.security'),
      description: 'Password and security settings',
      onClick: () => navigate('/agent/profile/security')
    },
    {
      icon: <HelpCircle size={20} color={Colors.neutral[600]} />,
      title: t('profile.help'),
      description: 'Get help and support',
      onClick: () => navigate('/agent/profile/help')
    },
  ]

  return (
    <div className="profile-container" style={{ backgroundColor: Colors.neutral[50] }}>
      {/* Header */}
      <div className="profile-header" style={{ borderBottomColor: Colors.neutral[200] }}>
        <h1 className="profile-header-title" style={{ color: Colors.neutral[900] }}>
          {t('navigation.profile')}
        </h1>
      </div>

      <div className="profile-content">
        {user && (
          <>
            {/* Profile Card */}
            <div className="profile-section">
              <div className="profile-card" style={{ 
                backgroundColor: Colors.neutral[100], 
                borderColor: Colors.neutral[200] 
              }}>
                <div className="avatar-container">
                  {user.avatar_url ? (
                    <img
                      src={`${user.avatar_url}?t=${Date.now()}`}
                      alt={user.full_name || ''}
                      className="profile-image"
                      style={{ borderColor: Colors.neutral[300] }}
                    />
                  ) : (
                    <div 
                      className="profile-image-placeholder" 
                      style={{ 
                        backgroundColor: Colors.neutral[200],
                        borderColor: Colors.neutral[300],
                        color: Colors.neutral[500]
                      }}
                    >
                      {user.full_name?.charAt(0).toUpperCase() || 'A'}
                    </div>
                  )}
                  <div 
                    className="camera-overlay" 
                    style={{ backgroundColor: Colors.primary[700] }}
                    title="Update profile picture"
                  >
                    <Camera size={16} color="white" />
                  </div>
                </div>

                <div className="profile-info">
                  <h3 className="profile-name" style={{ color: Colors.neutral[900] }}>
                    {user.full_name || t('common.user')}
                  </h3>
                  <p className="profile-email" style={{ color: Colors.neutral[600] }}>
                    {user.email}
                  </p>
                  <span className="role-chip" style={{ 
                    backgroundColor: Colors.primary[50], 
                    color: Colors.primary[800] 
                  }}>
                    {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Agent'}
                  </span>
                </div>
              </div>
            </div>

            {/* Theme Section */}
            <div className="theme-section">
              <h3 className="section-title" style={{ color: Colors.neutral[900] }}>
                {t('profile.appearance')}
              </h3>
              <div className="theme-card" style={{ 
                backgroundColor: Colors.neutral[100], 
                borderColor: Colors.neutral[200] 
              }}>
                <div className="theme-header">
                  <Settings size={20} color={Colors.neutral[600]} />
                  <div className="theme-text-container">
                    <div className="theme-title" style={{ color: Colors.neutral[900] }}>
                      {t('profile.theme')}
                    </div>
                    <div className="theme-description" style={{ color: Colors.neutral[600] }}>
                      Choose your preferred theme
                    </div>
                  </div>
                </div>
                
                <div className="theme-options">
                  {themeOptions.map((option) => (
                    <button
                      key={option.value}
                      className={`theme-option ${mode === option.value ? 'active' : ''}`}
                      style={{
                        backgroundColor: mode === option.value ? Colors.primary[700] : Colors.neutral[50],
                        borderColor: mode === option.value ? Colors.primary[700] : Colors.neutral[300],
                        color: mode === option.value ? 'white' : Colors.neutral[600]
                      }}
                      onClick={() => setMode(option.value as any)}
                    >
                      <option.icon size={16} />
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="menu-section">
              <h3 className="section-title" style={{ color: Colors.neutral[900] }}>
                {t('profile.settings')}
              </h3>
              <div className="menu-card" style={{ 
                backgroundColor: Colors.neutral[100], 
                borderColor: Colors.neutral[200] 
              }}>
                {menuItems.map((item, index) => (
                  <button
                    key={index}
                    className="menu-item"
                    style={{ borderBottomColor: Colors.neutral[200] }}
                    onClick={item.onClick}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = Colors.neutral[50]
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    <div className="menu-item-left">
                      <div className="menu-item-icon" style={{ backgroundColor: Colors.neutral[50] }}>
                        {item.icon}
                      </div>
                      <div className="menu-item-text-container">
                        <div className="menu-item-title" style={{ color: Colors.neutral[900] }}>
                          {item.title}
                        </div>
                        {item.description && (
                          <div className="menu-item-description" style={{ color: Colors.neutral[600] }}>
                            {item.description}
                          </div>
                        )}
                      </div>
                    </div>
                    {!item.isToggle && (
                      <ChevronRight size={16} color={Colors.neutral[400]} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Logout Section */}
            <div className="logout-section">
              <button
                className="logout-button"
                style={{ 
                  backgroundColor: Colors.neutral[100], 
                  borderColor: Colors.error[200],
                  color: Colors.error[600]
                }}
                onClick={() => signOut()}
              >
                <LogOut size={20} />
                <span>{t('auth.signOut')}</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Language Modal */}
      {showLanguageModal && (
        <div className="modal-overlay" onClick={() => setShowLanguageModal(false)}>
          <div 
            className="modal-content" 
            style={{ backgroundColor: Colors.neutral[100] }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="modal-title" style={{ color: Colors.neutral[900] }}>
              {t('profile.changeLanguage')}
            </h3>
            
            <button
              className={`language-option ${currentLanguage === 'en' ? 'active' : ''}`}
              style={{
                backgroundColor: currentLanguage === 'en' ? Colors.primary[50] : Colors.neutral[50],
                borderColor: currentLanguage === 'en' ? Colors.primary[300] : Colors.neutral[200]
              }}
              onClick={() => handleLanguageSelect('en')}
            >
              <Languages size={20} color={currentLanguage === 'en' ? Colors.primary[600] : Colors.neutral[600]} />
              <span 
                className="language-option-text" 
                style={{ color: currentLanguage === 'en' ? Colors.primary[800] : Colors.neutral[900] }}
              >
                English
              </span>
            </button>

            <button
              className={`language-option ${currentLanguage === 'fr' ? 'active' : ''}`}
              style={{
                backgroundColor: currentLanguage === 'fr' ? Colors.primary[50] : Colors.neutral[50],
                borderColor: currentLanguage === 'fr' ? Colors.primary[300] : Colors.neutral[200]
              }}
              onClick={() => handleLanguageSelect('fr')}
            >
              <Languages size={20} color={currentLanguage === 'fr' ? Colors.primary[600] : Colors.neutral[600]} />
              <span 
                className="language-option-text" 
                style={{ color: currentLanguage === 'fr' ? Colors.primary[800] : Colors.neutral[900] }}
              >
                Français
              </span>
            </button>

            <button
              className="cancel-button"
              style={{ 
                backgroundColor: Colors.neutral[200],
                color: Colors.neutral[700]
              }}
              onClick={() => setShowLanguageModal(false)}
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}

      {/* Message Toast */}
      {message && (
        <div 
          className="message-container" 
          style={{ 
            backgroundColor: message.type === 'success' ? Colors.success[600] : Colors.error[600] 
          }}
        >
          <div className="message-text">{message.text}</div>
        </div>
      )}
    </div>
  )
}
