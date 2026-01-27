import React, { useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import BottomNavigation from '@/components/BottomNavigation'
import Sidebar from '@/components/Sidebar'
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
  { path: '/guest', icon: Home, label: 'navigation.home' },
  { path: '/guest/map', icon: Map, label: 'navigation.map' },
  { path: '/guest/auth', icon: User, label: 'auth.login' },
]

export default function GuestLayout() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Redirect logged-in users to their appropriate route
  useEffect(() => {
    if (user) {
      const targetRoute = user.role === 'agent' ? '/agent' : '/user'
      navigate(targetRoute, { replace: true })
    }
  }, [user, navigate])

  return (
    <div className="app-layout">
      <Sidebar items={navItems} userRole="guest" />
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
