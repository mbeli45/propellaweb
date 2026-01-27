import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useThemeMode } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/I18nContext'
import { getColors } from '@/constants/Colors'
import { ArrowLeft, Lock, Eye, Shield, Bell, Key, Smartphone } from 'lucide-react'
import './Security.css'

export default function ProfileSecurity() {
  const { colorScheme } = useThemeMode()
  const { t } = useLanguage()
  const Colors = getColors(colorScheme)
  const navigate = useNavigate()

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [biometricEnabled, setBiometricEnabled] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)

  const handleChangePassword = () => {
    alert('This feature is coming soon! You will be able to change your password here.')
  }

  const securityItems = [
    {
      icon: <Shield size={24} />,
      iconBg: Colors.success[100],
      iconColor: Colors.success[700],
      title: 'Two-Factor Authentication',
      description: 'Add an extra layer of security to your account',
      isToggle: true,
      toggleValue: twoFactorEnabled,
      onToggleChange: () => {
        alert('Two-factor authentication will be available soon!')
      },
    },
    {
      icon: <Smartphone size={24} />,
      iconBg: Colors.primary[100],
      iconColor: Colors.primary[700],
      title: 'Biometric Login',
      description: 'Use fingerprint or face recognition',
      isToggle: true,
      toggleValue: biometricEnabled,
      onToggleChange: () => {
        alert('Biometric authentication will be available soon!')
      },
    },
    {
      icon: <Bell size={24} />,
      iconBg: Colors.warning[100],
      iconColor: Colors.warning[700],
      title: 'Security Notifications',
      description: 'Get notified about account activity',
      isToggle: true,
      toggleValue: notificationsEnabled,
      onToggleChange: () => setNotificationsEnabled(!notificationsEnabled),
    },
  ]

  return (
    <div className="security-container" style={{ backgroundColor: Colors.neutral[50], minHeight: '100vh' }}>
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
          {t('security.accountSecurity')}
        </h1>
      </div>

      <div style={{ padding: '20px 16px' }}>
        <div style={{
          backgroundColor: Colors.white,
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
        }}>
          {menuItems.map((item, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                borderBottom: index < menuItems.length - 1 ? `1px solid ${Colors.neutral[200]}` : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                {item.icon}
                <span style={{
                  fontSize: '16px',
                  fontWeight: '500',
                  color: Colors.neutral[900]
                }}>
                  {item.title}
                </span>
              </div>
              {item.isToggle ? (
                <label style={{
                  position: 'relative',
                  display: 'inline-block',
                  width: '44px',
                  height: '24px'
                }}>
                  <input
                    type="checkbox"
                    checked={item.toggleValue}
                    onChange={item.onToggleChange}
                    style={{
                      opacity: 0,
                      width: 0,
                      height: 0
                    }}
                  />
                  <span style={{
                    position: 'absolute',
                    cursor: 'pointer',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: item.toggleValue ? Colors.primary[600] : Colors.neutral[300],
                    borderRadius: '24px',
                    transition: '0.3s'
                  }}>
                    <span style={{
                      position: 'absolute',
                      content: '""',
                      height: '18px',
                      width: '18px',
                      left: '3px',
                      bottom: '3px',
                      backgroundColor: Colors.white,
                      borderRadius: '50%',
                      transition: '0.3s',
                      transform: item.toggleValue ? 'translateX(20px)' : 'translateX(0)'
                    }} />
                  </span>
                </label>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
