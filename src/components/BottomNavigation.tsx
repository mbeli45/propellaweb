import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Home, Map, User, MessageCircle, CalendarDays, Wallet, List } from 'lucide-react'
import { useThemeMode } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/I18nContext'
import { useBottomSheet } from '@/contexts/BottomSheetContext'
import { getColors } from '@/constants/Colors'
import Badge from './Badge'
import './BottomNavigation.css'

interface NavItem {
  path: string
  icon: React.ComponentType<{ size?: number; color?: string }>
  label: string
  badge?: number
}

interface BottomNavigationProps {
  items: NavItem[]
  transparent?: boolean
}

export default function BottomNavigation({ items, transparent = false }: BottomNavigationProps) {
  const { colorScheme } = useThemeMode()
  const { t } = useLanguage()
  const { isBottomSheetOpen } = useBottomSheet()
  const Colors = getColors(colorScheme)
  const location = useLocation()
  const [viewMode, setViewMode] = React.useState<string | null>(() => {
    // Initialize with current value from localStorage
    const isHomePage = location.pathname === '/user/home' || location.pathname === '/guest/home' || location.pathname === '/guest' || location.pathname === '/'
    return isHomePage ? localStorage.getItem('homeViewMode') : null
  })

  // Check if we're on a home page (where feed mode might be active)
  const isHomePage = location.pathname === '/user/home' || location.pathname === '/guest/home' || location.pathname === '/guest' || location.pathname === '/'

  // Update view mode when location changes
  React.useEffect(() => {
    if (isHomePage) {
      const mode = localStorage.getItem('homeViewMode')
      console.log('BottomNav: Current view mode:', mode, 'Path:', location.pathname)
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
        console.log('BottomNav: View mode changed to:', mode)
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
  console.log('BottomNav: Rendering with isFeedMode:', isFeedMode, 'viewMode:', viewMode)

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
      {items.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `nav-item ${isActive ? 'active' : ''}`
          }
          style={({ isActive }) => ({
            color: isActive 
              ? (isFeedMode ? Colors.white : Colors.primary[800]) 
              : (isFeedMode ? 'rgba(255,255,255,0.7)' : Colors.neutral[400]),
          })}
        >
          <div className="nav-icon-wrapper">
            <item.icon size={24} color="currentColor" />
            {item.badge && item.badge > 0 && (
              <Badge count={item.badge} size="small" />
            )}
          </div>
          <span className="nav-label">{t(item.label)}</span>
        </NavLink>
      ))}
    </nav>
  )
}
