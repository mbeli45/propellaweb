import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BadgeCheck,
  BarChart3,
  Bookmark,
  Camera,
  HeartHandshake,
  HelpCircle,
  Languages,
  Lock,
  LogOut,
  Monitor,
  Moon,
  Palette,
  Shield,
  Sun,
  Trash2,
  User as UserIcon,
  Wallet,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useThemeMode } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/I18nContext'
import { useStorage } from '@/hooks/useStorage'
import { useDialog } from '@/contexts/DialogContext'
import { supabase } from '@/lib/supabase'
import {
  PageHeader,
  ReservationsPage,
  SegmentedControl,
  SettingsGroup,
  SettingsRow,
  formatFcfa,
} from '@/components/reservations/ReservationUI'

type ThemeChoice = 'light' | 'dark' | 'auto'

/** Profile hub for customers and agents: identity, then grouped settings rows. */
export default function ProfileHome({ workspace }: { workspace: 'user' | 'agent' }) {
  const { user, signOut, deleteAccount, refreshUser } = useAuth()
  const { mode, setMode } = useThemeMode()
  const { t, changeLanguage, currentLanguage } = useLanguage()
  const { pickImage, uploadImage, uploading } = useStorage()
  const navigate = useNavigate()
  const { confirm } = useDialog()
  const isAgent = workspace === 'agent'
  const base = `/${workspace}`

  const [walletBalance, setWalletBalance] = useState<number | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Wallet isn't in the phone bottom bar; this row is its entry point.
  useEffect(() => {
    if (!isAgent || !user?.id) return
    let active = true
    supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setWalletBalance(data ? Number((data as any).balance) || 0 : 0)
      })
    return () => {
      active = false
    }
  }, [isAgent, user?.id])

  const flash = (next: { type: 'success' | 'error'; text: string }) => {
    setMessage(next)
    setTimeout(() => setMessage(null), next.type === 'success' ? 3000 : 5000)
  }

  const handleAvatarChange = async () => {
    try {
      const picked = await pickImage()
      const file = Array.isArray(picked) ? picked[0] : picked
      if (!file || !user?.id) return
      const uploaded = await uploadImage(file, 'avatars')
      if (!uploaded?.url) throw new Error('upload failed')
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: uploaded.url, updated_at: new Date().toISOString() })
        .eq('id', user.id)
      if (error) throw error
      await refreshUser()
      flash({ type: 'success', text: 'Profile picture updated successfully' })
    } catch (error) {
      console.error('Avatar update error:', error)
      flash({ type: 'error', text: 'Failed to update profile picture' })
    }
  }

  const handleLanguage = async (language: 'en' | 'fr') => {
    if (language === currentLanguage) return
    try {
      await changeLanguage(language)
    } catch {
      flash({ type: 'error', text: language === 'en' ? 'Failed to change language' : 'Échec du changement de langue' })
    }
  }

  if (!user) return null

  const name = user.full_name || t('common.user')
  const roleLabel = user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'
  const isVerified = !!(user as any).is_verified_agent

  return (
    <ReservationsPage narrow label={t('profile.title')}>
      <PageHeader title={t('profile.title')} />

      <div className="ds-identity">
        <button
          type="button"
          className="ds-identity-avatar"
          onClick={handleAvatarChange}
          disabled={uploading}
          aria-label={t('profileMenu.changePhoto')}
        >
          {user.avatar_url ? <img src={user.avatar_url} alt="" /> : name.charAt(0).toUpperCase()}
          <span className="ds-identity-camera" aria-hidden="true">
            <Camera size={13} />
          </span>
        </button>
        <div className="ds-identity-text">
          <h2 className="ds-identity-name">
            <span>{name}</span>
            {isVerified && <BadgeCheck size={18} aria-label={t('profileMenu.verified')} />}
          </h2>
          <p className="ds-identity-email">{user.email}</p>
          <span className="ds-identity-role">{roleLabel}</span>
        </div>
      </div>

      <SettingsGroup title={t('profileMenu.activity')}>
        {isAgent && (
          <SettingsRow
            icon={Wallet}
            label={t('wallet.title')}
            value={walletBalance === null ? '—' : formatFcfa(walletBalance)}
            valueStrong
            onClick={() => navigate('/agent/wallet')}
          />
        )}
        {isAgent && <SettingsRow icon={BarChart3} label={t('profileMenu.analytics')} onClick={() => navigate('/agent/analytics')} />}
        <SettingsRow
          icon={HeartHandshake}
          label={t('profileMenu.myDeals')}
          onClick={() => navigate(isAgent ? '/agent/deals' : '/user/deals')}
        />
        <SettingsRow icon={Bookmark} label={t('saved.title')} onClick={() => navigate(`${base}/saved`)} />
      </SettingsGroup>

      <SettingsGroup title={t('profileMenu.account')}>
        <SettingsRow icon={UserIcon} label={t('profileMenu.editProfile')} onClick={() => navigate(`${base}/profile/settings`)} />
        {isAgent && <SettingsRow icon={Shield} label={t('identity.title')} onClick={() => navigate('/agent/identity')} />}
        {isAgent && (
          <SettingsRow
            icon={Shield}
            label={t('identity.businessTitle')}
            value={isVerified ? t('profileMenu.verified') : t('profileMenu.notVerified')}
            onClick={() => navigate('/agent/profile/verification')}
          />
        )}
        <SettingsRow icon={Lock} label={t('profileMenu.securityPrivacy')} onClick={() => navigate(`${base}/profile/security`)} />
      </SettingsGroup>

      <SettingsGroup title={t('profileMenu.preferences')}>
        <SettingsRow
          icon={Languages}
          label={t('profile.language')}
          right={
            <div style={{ width: 132 }}>
              <SegmentedControl
                label={t('profile.language')}
                options={[
                  { value: 'en', label: 'EN' },
                  { value: 'fr', label: 'FR' },
                ]}
                value={currentLanguage === 'fr' ? 'fr' : 'en'}
                onChange={(value) => handleLanguage(value)}
              />
            </div>
          }
        />
        <SettingsRow
          icon={Palette}
          label={t('profile.theme')}
          below={
            <SegmentedControl<ThemeChoice>
              label={t('profile.theme')}
              options={[
                { value: 'light', label: t('profileMenu.themeLight'), icon: Sun },
                { value: 'dark', label: t('profileMenu.themeDark'), icon: Moon },
                { value: 'auto', label: t('profileMenu.themeAuto'), icon: Monitor },
              ]}
              value={(mode as ThemeChoice) || 'auto'}
              onChange={(value) => setMode(value as any)}
            />
          }
        />
      </SettingsGroup>

      <SettingsGroup title={t('profileMenu.support')}>
        <SettingsRow icon={HelpCircle} label={t('help.helpAndSupport')} onClick={() => navigate(`${base}/profile/help`)} />
      </SettingsGroup>

      <SettingsGroup footer={t('profileMenu.deleteAccountFooter')}>
        <SettingsRow
          icon={LogOut}
          label={t('auth.signOut')}
          tone="danger"
          onClick={async () => {
            const ok = await confirm({
              title: t('auth.signOut'),
              message: t('auth.confirmSignOut'),
              confirmText: t('auth.signOut'),
              cancelText: t('common.cancel'),
              variant: 'danger',
            })
            if (ok) signOut()
          }}
        />
        <SettingsRow
          icon={Trash2}
          label={t('profile.deleteAccount')}
          tone="danger"
          onClick={async () => {
            const ok = await confirm({
              title: t('profile.deleteAccount'),
              message: t('profile.deleteAccountWarning'),
              confirmText: t('profile.deleteAccount'),
              cancelText: t('common.cancel'),
              variant: 'danger',
            })
            if (!ok) return
            try {
              await deleteAccount()
            } catch {
              flash({ type: 'error', text: t('profile.deleteAccountFailed', 'Failed to delete account') })
            }
          }}
        />
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
