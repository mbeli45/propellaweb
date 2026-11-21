import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Home, Map, User, CalendarDays, Wallet, List } from 'lucide-react'
import { useThemeMode } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/I18nContext'
import { useBottomSheet } from '@/contexts/BottomSheetContext'
import { getColors } from '@/constants/Colors'
import Badge from './Badge'
import TabIcon, { type TabIconName } from './TabIcon'
import './BottomNavigation.css'

interface NavItem {
  path: string
  icon: React.ComponentType<{ size?: number; color?: string }>
  /** Ionicons tab icon (filled when active); `icon` stays for the desktop sidebar. */
  tabIcon?: TabIconName
  label: string
  badge?: number
  /** Extra routes that should keep this tab highlighted */
  activePaths?: string[]
  /** Desktop sidebar only; the phone bottom bar keeps to 4 items */
  sidebarOnly?: boolean
}

interface BottomNavigationProps {
  items: NavItem[]
  transparent?: boolean
}

// Home screens (Properties and Stays), where the video feed can be on.
const HOME_PATHS = new Set(['/', '/user', '/user/home', '/guest', '/guest/home'])

export default function BottomNavigation({ items, transparent = false }: BottomNavigationProps) {
  const { colorScheme } = useThemeMode()
  const { t } = useLanguage()
  const { isBottomSheetOpen } = useBottomSheet()
  const Colors = getColors(colorScheme)
  const location = useLocation()
  const [viewMode, setViewMode] = React.useState<string | null>(() => {
    // Initialize with current value from localStorage
    const isHomePage = HOME_PATHS.has(location.pathname.replace(/\/+$/, '') || '/')
    return isHomePage ? localStorage.getItem('homeViewMode') : null
  })

  // Check if we're on a home page (where feed mode might be active)
  const isHomePage = HOME_PATHS.has(location.pathname.replace(/\/+$/, '') || '/')

  // Update view mode when location changes
  React.useEffect(() => {
    if (isHomePage) {
      const mode = localStorage.getItem('homeViewMode')
      setViewMode(mode)
    } else {
      setViewMode(null)
    }
  }, [isHomePage, location.pathname])

  // Listen for view mode changes
  React.useEffect(() => {
    const handleViewModeChange = () => {
      if (isHomePage) {
        const mode = localStorage.getItem('homeViewMode')
        setViewMode(mode)
      }
    }

    window.addEventListener('viewModeChange', handleViewModeChange)
    return () => window.removeEventListener('viewModeChange', handleViewModeChange)
  }, [isHomePage])

  // Hide bottom navigation when bottom sheet is open
  if (isBottomSheetOpen) {
    return null
  }

  const isFeedMode = viewMode === 'feed'

  return (
    <nav
      className="bottom-navigation"
      style={{
        backgroundColor: isFeedMode ? 'rgba(0,0,0,0.1)' : Colors.white,
        borderTop: isFeedMode ? 'none' : `0.5px solid ${Colors.neutral[200]}`,
        backdropFilter: isFeedMode ? 'blur(10px)' : 'none',
        WebkitBackdropFilter: isFeedMode ? 'blur(10px)' : 'none',
      }}
    >
      {items.filter((item) => !item.sidebarOnly).map((item) => {
        const matchesExtra = item.activePaths?.some((p) => location.pathname.startsWith(p)) ?? false
        return (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `nav-item ${isActive || matchesExtra ? 'active' : ''}`
          }
          style={({ isActive }) => ({
            color: isActive || matchesExtra
              ? (isFeedMode ? Colors.white : Colors.primary[800]) 
              : (isFeedMode ? 'rgba(255,255,255,0.7)' : Colors.neutral[400]),
          })}
        >
          {({ isActive }) => (
            <>
              <div className="nav-icon-wrapper">
                {item.tabIcon ? (
                  <TabIcon name={item.tabIcon} focused={isActive || matchesExtra} size={24} />
                ) : (
                  <item.icon size={24} color="currentColor" />
                )}
                {item.badge && item.badge > 0 && (
                  <Badge count={item.badge} size="small" />
                )}
              </div>
              <span className="nav-label">{t(item.label)}</span>
            </>
          )}
        </NavLink>
        )
      })}
    </nav>
  )
}
