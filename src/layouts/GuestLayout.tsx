import { isListerRole } from '@/lib/identity'
import React, { useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import BottomNavigation from '@/components/BottomNavigation'
import TopNav from '@/components/TopNav'
import { Home, Map, User } from 'lucide-react'
import GuestHome from '@/pages/guest/Home'
import GuestMap from '@/pages/guest/Map'
import GuestAuth from '@/pages/guest/Auth'
import UserExplore from '@/pages/user/Explore'
import PropertyDetail from '@/pages/property/[id]'
import AgentProfilePage from '@/pages/agent/[id]'
import { useAuth } from '@/contexts/AuthContext'
import './Layout.css'

const navItems = [
  { path: '/guest', icon: Home, label: 'navigation.home', tabIcon: 'home' as const },
  { path: '/guest/map', icon: Map, label: 'navigation.map', tabIcon: 'map' as const },
  { path: '/guest/auth', icon: User, label: 'auth.login', tabIcon: 'profile' as const },
]

export default function GuestLayout() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Redirect logged-in users to their appropriate route
  useEffect(() => {
    if (user) {
      const targetRoute = isListerRole(user.role) ? '/agent' : '/user'
      navigate(targetRoute, { replace: true })
    }
  }, [user, navigate])

  return (
    <div className="app-layout app-layout--topnav">
      <TopNav items={navItems} userRole="guest" />
      <div className="app-content">
        <main className="main-content">
          <Routes>
            <Route index element={<GuestHome />} />
            <Route path="explore" element={<UserExplore />} />
            <Route path="map" element={<GuestMap />} />
            <Route path="auth" element={<GuestAuth />} />
          </Routes>
        </main>
        <BottomNavigation items={navItems} />
      </div>
    </div>
  )
}
