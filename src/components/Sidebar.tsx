import React, { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useLanguage } from '@/contexts/I18nContext'
import { useAuth } from '@/contexts/AuthContext'
import { useDialog } from '@/contexts/DialogContext'
import './Sidebar.css'

interface NavItem {
  sidebarOnly?: boolean
  path: string
  icon: React.ComponentType<{ size?: number; color?: string }>
  label: string
  badge?: number
  /** Extra routes that should keep this item highlighted */
  activePaths?: string[]
}

interface SidebarProps {
  items: NavItem[]
  userRole?: 'user' | 'agent' | 'guest'
}

const COLLAPSED_KEY = 'propella.sidebarCollapsed'

function readCollapsed() {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === '1'
  } catch {
    return false
  }
}

/** Desktop navigation on the design language: quiet surface, 44 px rows, one tint for "you are here". */
export default function Sidebar({ items, userRole = 'user' }: SidebarProps) {
  const { t } = useLanguage()
  const { signOut, user } = useAuth()
  const { confirm } = useDialog()
  const location = useLocation()
  const [isCollapsed, setIsCollapsed] = useState(readCollapsed)

  useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-width', isCollapsed ? '76px' : '248px')
    try {
      localStorage.setItem(COLLAPSED_KEY, isCollapsed ? '1' : '0')
    } catch {
      // Per-viewer convenience only.
    }
  }, [isCollapsed])

  const handleSignOut = async () => {
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

  const name = user?.full_name || t('common.user')
  const profilePath = userRole === 'guest' ? null : `/${userRole}/profile`
  const collapseLabel = isCollapsed ? t('sidebar.expand', 'Expand sidebar') : t('sidebar.collapse', 'Collapse sidebar')

  return (
    <aside className={`sidebar${isCollapsed ? ' collapsed' : ''}`} aria-label={t('sidebar.navigation', 'Main navigation')}>
      <div className="sidebar-header">
        {!isCollapsed && (
          <div className="sidebar-brand">
            <img
              src="/app-icon.png"
              alt=""
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
            <span>Propella</span>
          </div>
        )}
        <button
          type="button"
          className="sidebar-icon-btn"
          onClick={() => setIsCollapsed((value) => !value)}
          aria-label={collapseLabel}
          aria-expanded={!isCollapsed}
          title={collapseLabel}
        >
          {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        {items.map((item) => {
          const isParentRoute = item.path === '/user' || item.path === '/agent'
          const matchesExtra = item.activePaths?.some((p) => location.pathname.startsWith(p)) ?? false
          const label = t(item.label)
          const badge = item.badge && item.badge > 0 ? item.badge : 0
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={isParentRoute}
              className={({ isActive }) => `sidebar-nav-item${isActive || matchesExtra ? ' is-active' : ''}`}
              title={isCollapsed ? label : undefined}
              aria-label={badge ? `${label}, ${badge}` : isCollapsed ? label : undefined}
            >
              <span className="sidebar-nav-icon" aria-hidden="true">
                <item.icon size={20} color="currentColor" />
                {isCollapsed && badge > 0 && <span className="sidebar-dot" />}
              </span>
              {!isCollapsed && <span className="sidebar-nav-label">{label}</span>}
              {!isCollapsed && badge > 0 && (
                <span className="sidebar-count" aria-hidden="true">
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </NavLink>
          )
        })}
      </nav>

      {user && (
        <div className="sidebar-footer">
          {profilePath && (
            <NavLink
              to={profilePath}
              className={({ isActive }) => `sidebar-user${isActive ? ' is-active' : ''}`}
              title={isCollapsed ? name : undefined}
              aria-label={isCollapsed ? name : undefined}
            >
              <span className="sidebar-avatar" aria-hidden="true">
                {user.avatar_url ? <img src={user.avatar_url} alt="" /> : name.charAt(0).toUpperCase()}
              </span>
              {!isCollapsed && (
                <span className="sidebar-user-text">
                  <span className="sidebar-user-name">{name}</span>
                  <span className="sidebar-user-email">{user.email}</span>
                </span>
              )}
            </NavLink>
          )}
          <button
            type="button"
            onClick={handleSignOut}
            className="sidebar-signout"
            title={isCollapsed ? t('auth.signOut') : undefined}
            aria-label={isCollapsed ? t('auth.signOut') : undefined}
          >
            <LogOut size={18} aria-hidden="true" />
            {!isCollapsed && <span>{t('auth.signOut')}</span>}
          </button>
        </div>
      )}
    </aside>
  )
}
