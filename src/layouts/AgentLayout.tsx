import React from 'react'
import { Routes, Route } from 'react-router-dom'
import BottomNavigation from '@/components/BottomNavigation'
import Sidebar from '@/components/Sidebar'
import { List, CalendarDays, MessageCircle, Wallet, User } from 'lucide-react'
import AgentListings from '@/pages/agent/Listings'
import AgentReservations from '@/pages/agent/Reservations'
import UserMessages from '@/pages/user/Messages'
import AgentWallet from '@/pages/agent/Wallet'
import AgentProfile from '@/pages/agent/Profile'
import AgentAnalytics from '@/pages/agent/Analytics'
import ChatDetail from '@/pages/chat/[id]'
import PropertyDetail from '@/pages/property/[id]'
import AddProperty from '@/pages/property/add'
import EditProperty from '@/pages/property/edit/[id]'
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

export default function AgentLayout() {
  const { user } = useAuth()
  const { reservationBadgeCount, messageBadgeCount } = useBadgeCounts(user?.id || '', user?.role)

  console.log('🏢 [AgentLayout] Rendering with user:', user?.email, '| Role:', user?.role)

  const navItems = [
    { path: '/agent', icon: List, label: 'navigation.listings' },
    { path: '/agent/reservations', icon: CalendarDays, label: 'navigation.reservations', badge: reservationBadgeCount > 0 ? reservationBadgeCount : undefined },
    { path: '/agent/messages', icon: MessageCircle, label: 'navigation.messages', badge: messageBadgeCount > 0 ? messageBadgeCount : undefined },
    { path: '/agent/wallet', icon: Wallet, label: 'navigation.wallet' },
    { path: '/agent/profile', icon: User, label: 'navigation.profile' },
  ]
  return (
    <div className="app-layout">
      <Sidebar items={navItems} userRole="agent" />
      <div className="app-content">
        <main className="main-content">
          <Routes>
            <Route index element={<AgentListings />} />
            <Route path="reservations" element={<AgentReservations />} />
            <Route path="messages" element={<UserMessages />} />
            <Route path="messages/:id" element={<ChatDetail />} />
            <Route path="wallet" element={<AgentWallet />} />
            <Route path="analytics" element={<AgentAnalytics />} />
            <Route path="profile" element={<AgentProfile />} />
            <Route path="profile/settings" element={<ProfileSettings />} />
            <Route path="profile/verification" element={<ProfileVerification />} />
            <Route path="profile/security" element={<ProfileSecurity />} />
            <Route path="profile/help" element={<ProfileHelp />} />
            <Route path="profile/help/faq" element={<FAQ />} />
            <Route path="profile/help/privacy" element={<Privacy />} />
            <Route path="profile/help/terms" element={<Terms />} />
            <Route path="property/add" element={<AddProperty />} />
            <Route path="property/edit/:id" element={<EditProperty />} />
            <Route path="property/:id" element={<PropertyDetail />} />
            <Route path="chat/:id" element={<ChatDetail />} />
          </Routes>
        </main>
        <BottomNavigation items={navItems} />
      </div>
    </div>
  )
}
