import React, { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { LogOut, Menu, User } from 'lucide-react'
import { useLanguage } from '@/contexts/I18nContext'
import { useAuth } from '@/contexts/AuthContext'
import { useDialog } from '@/contexts/DialogContext'
import MarketSwitch from '@/components/MarketSwitch'
import './TopNav.css'

interface NavItem {
  sidebarOnly?: boolean
  path: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: React.ComponentType<any>
  label: string
  badge?: number
  /** Extra routes that should keep this item highlighted */
  activePaths?: string[]
}

interface TopNavProps {
  items: NavItem[]
  userRole?: 'user' | 'agent' | 'guest'
}

/**
 * Desktop header (phones keep the bottom bar): brand on the left, the
 * Properties | Stays switch in the middle on Home, everything else in the menu.
 * On Home it runs straight into the page's tabs and search as one header.
 */
export default function TopNav({ items, userRole = 'user' }: TopNavProps) {
  const { t } = useLanguage()
  const { signOut, user } = useAuth()
  const { confirm } = useDialog()
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => setMenuOpen(false), [location.pathname])

  // Home's video feed fills the screen; the header then floats over it.
  const readFeed = () => { try { return localStorage.getItem('homeViewMode') === 'feed' } catch { return false } }
  const [feed, setFeed] = useState(readFeed)
  useEffect(() => {
    const on = () => setFeed(readFeed())
    window.addEventListener('viewModeChange', on)
    return () => window.removeEventListener('viewModeChange', on)
  }, [])
  useEffect(() => {
    if (!menuOpen) return
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !menuRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', close)
    }
  }, [menuOpen])

  const handleSignOut = async () => {
    setMenuOpen(false)
    const ok = await confirm({
      title: t('auth.signOut'),
      message: t('auth.confirmSignOut'),
      confirmText: t('auth.signOut'),
      cancelText: t('common.cancel'),
      variant: 'danger',
    })
    if (!ok) return
    try {
      await signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const home = items[0]?.path || '/'
  // Home for guests and renters carries the Properties | Stays switch.
  const onHome = userRole !== 'agent' && location.pathname.replace(/\/$/, '') === home
  const name = user?.full_name || t('common.user')
  const profilePath = userRole === 'guest' ? null : `/${userRole}/profile`
  const links = items.filter((item) => item.path !== profilePath && item.path !== '/guest/auth')
  const anyBadge = items.some((item) => (item.badge || 0) > 0)

  return (
    <header className={`topnav${onHome ? ' topnav--home' : ''}${onHome && feed ? ' topnav--feed' : ''}`}>
      <div className="topnav-start">
        <Link to={home} className="topnav-brand">
          <img src="/app-icon.png" alt="" onError={(e) => { e.currentTarget.style.display = 'none' }} />
          <span>Propella</span>
        </Link>
        {/* Over the feed, the switch hangs under the logo, beside the video column. */}
        {onHome && feed && <MarketSwitch overlay />}
      </div>

      <div className="topnav-center">{onHome && !feed && <MarketSwitch tabs />}</div>

      <div className="topnav-account" ref={menuRef}>
        <button
          type="button"
          className="topnav-menu-btn"
          onClick={() => setMenuOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label={t('sidebar.navigation', 'Main navigation')}
        >
          <Menu size={18} aria-hidden="true" />
          <span className="topnav-avatar" aria-hidden="true">
            {user?.avatar_url ? <img src={user.avatar_url} alt="" /> : user ? name.charAt(0).toUpperCase() : <User size={16} />}
          </span>
          {anyBadge && <span className="topnav-dot" aria-hidden="true" />}
        </button>

        {menuOpen && (
          <div className="topnav-menu" role="menu">
            {user && (
              <div className="topnav-menu-head">
                <strong>{name}</strong>
                <span>{user.email}</span>
              </div>
            )}
            {links.map((item) => {
              const isParentRoute = item.path === '/user' || item.path === '/agent' || item.path === '/guest'
              const matchesExtra = item.activePaths?.some((p) => location.pathname.startsWith(p)) ?? false
              const badge = item.badge && item.badge > 0 ? item.badge : 0
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={isParentRoute}
                  role="menuitem"
                  className={({ isActive }) => `topnav-menu-item${isActive || matchesExtra ? ' is-active' : ''}`}
                >
                  <item.icon size={18} color="currentColor" aria-hidden="true" />
                  <span>{t(item.label)}</span>
                  {badge > 0 && <span className="topnav-count">{badge > 99 ? '99+' : badge}</span>}
                </NavLink>
              )
            })}
            {(profilePath || user) && <div className="topnav-menu-sep" />}
            {profilePath && (
              <button type="button" role="menuitem" className="topnav-menu-item" onClick={() => navigate(profilePath)}>
                <User size={18} aria-hidden="true" /> <span>{t('navigation.profile')}</span>
              </button>
            )}
            {user ? (
              <button type="button" role="menuitem" className="topnav-menu-item is-danger" onClick={handleSignOut}>
                <LogOut size={18} aria-hidden="true" /> <span>{t('auth.signOut')}</span>
              </button>
            ) : (
              <button type="button" role="menuitem" className="topnav-menu-item" onClick={() => navigate('/guest/auth')}>
                <User size={18} aria-hidden="true" /> <span>{t('auth.login')}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
