import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useThemeMode } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/I18nContext'
import { getColors } from '@/constants/Colors'
import { User, LogIn, UserPlus } from 'lucide-react'
import '../auth/Auth.css'

export default function GuestAuth() {
  const { colorScheme } = useThemeMode()
  const { t } = useLanguage()
  const Colors = getColors(colorScheme)
  const navigate = useNavigate()

  return (
    <div
      className="auth-container"
      style={{
        backgroundColor: Colors.neutral[100],
        justifyContent: 'center',
        alignItems: 'center',
        padding: '32px',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          maxWidth: '400px',
          width: '100%',
        }}
      >
        <div
          style={{
            width: '120px',
            height: '120px',
            borderRadius: '60px',
            backgroundColor: Colors.primary[50],
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: '32px',
          }}
        >
          <User size={64} color={Colors.primary[600]} />
        </div>

        <h1
          style={{
            fontSize: '28px',
            fontWeight: '700',
            color: Colors.neutral[800],
            textAlign: 'center',
            marginBottom: '12px',
            margin: '0 0 12px 0',
          }}
        >
          {t('guestAuth.welcomeToPropella')}
        </h1>
        <p
          style={{
            fontSize: '16px',
            color: Colors.neutral[600],
            textAlign: 'center',
            lineHeight: '24px',
            marginBottom: '48px',
            margin: '0 0 48px 0',
          }}
        >
          {t('guestAuth.journeyDescription')}
        </p>

        <div
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <button
            onClick={() => navigate('/auth/login')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '56px',
              borderRadius: '12px',
              padding: '0 24px',
              marginBottom: '16px',
              backgroundColor: Colors.primary[600],
              color: '#FFFFFF',
              border: 'none',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = Colors.primary[700]
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = Colors.primary[600]
            }}
          >
            <LogIn size={20} color="#FFFFFF" style={{ marginRight: '8px' }} />
            {t('guestAuth.signIn')}
          </button>

          <button
            onClick={() => navigate('/auth/signup')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '56px',
              borderRadius: '12px',
              padding: '0 24px',
              marginBottom: '16px',
              backgroundColor: 'transparent',
              border: `2px solid ${Colors.primary[600]}`,
              color: Colors.primary[600],
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = Colors.primary[700]
              e.currentTarget.style.color = Colors.primary[700]
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = Colors.primary[600]
              e.currentTarget.style.color = Colors.primary[600]
            }}
          >
            <UserPlus size={20} color={Colors.primary[700]} style={{ marginRight: '8px' }} />
            {t('guestAuth.signUp')}
          </button>
        </div>

        <button
          onClick={() => navigate('/user/explore')}
          style={{
            marginTop: '16px',
            backgroundColor: 'transparent',
            border: `1px solid ${Colors.neutral[300]}`,
            borderRadius: '12px',
            padding: '12px 24px',
            color: Colors.neutral[600],
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = Colors.neutral[400]
            e.currentTarget.style.color = Colors.neutral[700]
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = Colors.neutral[300]
            e.currentTarget.style.color = Colors.neutral[600]
          }}
        >
          {t('guestAuth.exploreAsGuest')}
        </button>
      </div>
    </div>
  )
}
