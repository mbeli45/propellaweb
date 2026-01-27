import React, { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Home, Map, User, MessageCircle, CalendarDays, Wallet, List, LogOut, ChevronLeft, ChevronRight } from 'lucide-react'
import { useThemeMode } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/I18nContext'
import { useAuth } from '@/contexts/AuthContext'
import { getColors } from '@/constants/Colors'
import Badge from './Badge'
import './Sidebar.css'

interface NavItem {
  path: string
  icon: React.ComponentType<{ size?: number; color?: string }>
  label: string
  badge?: number
}

interface SidebarProps {
  items: NavItem[]
  userRole?: 'user' | 'agent' | 'guest'
}

export default function Sidebar({ items, userRole = 'user' }: SidebarProps) {
  const { colorScheme } = useThemeMode()
  const { t } = useLanguage()
  const { signOut, user } = useAuth()
  const Colors = getColors(colorScheme)
  const location = useLocation()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  // Update CSS variable for sidebar width
  useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-width', isCollapsed ? '80px' : '260px')
  }, [isCollapsed])

  return (
    <aside
      className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}
      style={{
        backgroundColor: Colors.white,
        borderRight: `1px solid ${Colors.neutral[200]}`,
      }}
    >
      <div className="sidebar-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {!isCollapsed && (
            <img 
              src="/app-icon.png" 
              alt="Propella" 
              style={{ 
                width: '32px', 
                height: '32px', 
                borderRadius: '8px',
                objectFit: 'cover'
              }}
              onError={(e) => {
                // Hide image if not found
                e.currentTarget.style.display = 'none'
              }}
            />
          )}
          {!isCollapsed && (
            <h2 style={{ color: Colors.neutral[900], fontSize: '20px', fontWeight: '700', margin: 0 }}>
              Propella
            </h2>
          )}
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="sidebar-toggle"
          style={{
            position: 'absolute',
            right: '8px',
            top: '24px',
            background: Colors.neutral[100],
            border: 'none',
            borderRadius: '6px',
            padding: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = Colors.neutral[200]
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = Colors.neutral[100]
          }}
        >
          {isCollapsed ? (
            <ChevronRight size={16} color={Colors.neutral[700]} />
          ) : (
            <ChevronLeft size={16} color={Colors.neutral[700]} />
          )}
        </button>
        {user && !isCollapsed && (
          <div className="sidebar-user-info">
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: Colors.primary[100],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: Colors.primary[700],
                fontWeight: '600',
                fontSize: '14px',
              }}
            >
              {user.full_name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: '14px',
                  fontWeight: '500',
                  color: Colors.neutral[900],
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {user.full_name}
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: '12px',
                  color: Colors.neutral[500],
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {user.email}
              </p>
            </div>
          </div>
        )}
        {user && isCollapsed && (
          <div 
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: Colors.primary[100],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: Colors.primary[700],
              fontWeight: '600',
              fontSize: '16px',
              margin: '16px auto 0',
            }}
            title={user.full_name || ''}
          >
            {user.full_name?.charAt(0).toUpperCase() || 'U'}
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        {items.map((item) => {
          // Determine if this is a parent route that should only match exactly
          const isParentRoute = item.path === '/user' || item.path === '/agent'
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={isParentRoute}
              className="sidebar-nav-item"
              style={({ isActive }) => ({
                color: isActive ? Colors.primary[800] : Colors.neutral[600],
                backgroundColor: isActive ? Colors.primary[50] : 'transparent',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
              })}
              title={isCollapsed ? t(item.label) : ''}
            >
              {({ isActive }) => (
                <>
                  <div className="sidebar-nav-icon-wrapper">
                    <item.icon size={20} color="currentColor" />
                    {item.badge && item.badge > 0 && (
                      <Badge count={item.badge} size="small" />
                    )}
                  </div>
                  {!isCollapsed && <span className="sidebar-nav-label">{t(item.label)}</span>}
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      {user && (
        <div className="sidebar-footer">
          <button
            onClick={handleSignOut}
            className="sidebar-signout"
            style={{
              color: Colors.error[600],
              justifyContent: isCollapsed ? 'center' : 'flex-start',
            }}
            title={isCollapsed ? t('auth.signOut') : ''}
          >
            <LogOut size={20} />
            {!isCollapsed && <span>{t('auth.signOut')}</span>}
          </button>
        </div>
      )}
    </aside>
  )
}
