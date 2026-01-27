import React from 'react'
import { NavLink } from 'react-router-dom'
import { Home, Map, User, MessageCircle, CalendarDays, Wallet, List } from 'lucide-react'
import { useThemeMode } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/I18nContext'
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
}

export default function BottomNavigation({ items }: BottomNavigationProps) {
  const { colorScheme } = useThemeMode()
  const { t } = useLanguage()
  const Colors = getColors(colorScheme)

  return (
    <nav
      className="bottom-navigation"
      style={{
        backgroundColor: Colors.white,
        borderTop: `0.5px solid ${Colors.neutral[200]}`,
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
            color: isActive ? Colors.primary[800] : Colors.neutral[400],
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
