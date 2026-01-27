import React from 'react'
import { Routes, Route } from 'react-router-dom'
import BottomNavigation from '@/components/BottomNavigation'
import Sidebar from '@/components/Sidebar'
import { Home, Map, User, MessageCircle, CalendarDays } from 'lucide-react'
import UserHome from '@/pages/user/Home'
import UserMap from '@/pages/user/Map'
import UserMessages from '@/pages/user/Messages'
import UserReservations from '@/pages/user/Reservations'
import UserProfile from '@/pages/user/Profile'
import UserExplore from '@/pages/user/Explore'
import UserCommissions from '@/pages/user/Commissions'
import ChatDetail from '@/pages/chat/[id]'
import ProfileSettings from '@/pages/profile/Settings'
import ProfileVerification from '@/pages/profile/Verification'
import ProfileSecurity from '@/pages/profile/Security'
import ProfileHelp from '@/pages/profile/Help'
import FAQ from '@/pages/profile/help/FAQ'
import Privacy from '@/pages/profile/help/Privacy'
import Terms from '@/pages/profile/help/Terms'
import { useAuth } from '@/contexts/AuthContext'
import { useBadgeCounts } from '@/hooks/useBadgeCounts'
import './Layout.css'

export default function UserLayout() {
  const { user } = useAuth()
  const { reservationBadgeCount, messageBadgeCount } = useBadgeCounts(user?.id || '', user?.role)

  console.log('👤 [UserLayout] Rendering with user:', user?.email, '| Role:', user?.role)

  const navItems = [
    { path: '/user', icon: Home as React.ComponentType<{ size?: number; color?: string }>, label: 'navigation.home' },
    { path: '/user/map', icon: Map as React.ComponentType<{ size?: number; color?: string }>, label: 'navigation.map' },
    { path: '/user/reservations', icon: CalendarDays as React.ComponentType<{ size?: number; color?: string }>, label: 'navigation.reservations', badge: reservationBadgeCount > 0 ? reservationBadgeCount : undefined },
    { path: '/user/messages', icon: MessageCircle as React.ComponentType<{ size?: number; color?: string }>, label: 'navigation.messages', badge: messageBadgeCount > 0 ? messageBadgeCount : undefined },
    { path: '/user/profile', icon: User as React.ComponentType<{ size?: number; color?: string }>, label: 'navigation.profile' },
  ]

  return (
    <div className="app-layout">
      <Sidebar items={navItems} userRole="user" />
      <div className="app-content">
        <main className="main-content">
          <Routes>
            <Route index element={<UserHome />} />
            <Route path="map" element={<UserMap />} />
            <Route path="messages" element={<UserMessages />} />
            <Route path="messages/:id" element={<ChatDetail />} />
            <Route path="reservations" element={<UserReservations />} />
            <Route path="explore" element={<UserExplore />} />
            <Route path="commissions" element={<UserCommissions />} />
            <Route path="profile" element={<UserProfile />} />
            <Route path="profile/settings" element={<ProfileSettings />} />
            <Route path="profile/verification" element={<ProfileVerification />} />
            <Route path="profile/security" element={<ProfileSecurity />} />
            <Route path="profile/help" element={<ProfileHelp />} />
            <Route path="profile/help/faq" element={<FAQ />} />
            <Route path="profile/help/privacy" element={<Privacy />} />
            <Route path="profile/help/terms" element={<Terms />} />
          </Routes>
        </main>
        <BottomNavigation items={navItems} />
      </div>
    </div>
  )
}
