import React, { useEffect, useState } from 'react'
import { Navigate, Routes, Route, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import Login from '@/pages/auth/Login'
import Signup from '@/pages/auth/Signup'
import ForgotPassword from '@/pages/auth/ForgotPassword'
import ResetPassword from '@/pages/auth/ResetPassword'
import Verify from '@/pages/auth/Verify'
import Callback from '@/pages/auth/Callback'
import { agentLandingRoute } from '@/lib/identity'
import Loader from '@/components/ui/Loader'

function SignedInLanding({ role }: { role: string }) {
  const [route, setRoute] = useState<string | null>(null)
  useEffect(() => {
    let active = true
    if (role === 'agent' || role === 'landlord') {
      void agentLandingRoute().then(next => { if (active) setRoute(next) })
    } else setRoute('/user')
    return () => { active = false }
  }, [role])
  return route ? <Navigate to={route} replace /> : <Loader variant="fullscreen" />
}

export default function AuthLayout() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (!loading && user && (location.pathname === '/auth' || location.pathname === '/auth/login')) {
    return <SignedInLanding key={user.id} role={user.role} />
  }

  return (
    <Routes>
      <Route path="login" element={<Login />} />
      <Route path="signup" element={<Signup />} />
      <Route path="forgot-password" element={<ForgotPassword />} />
      <Route path="reset-password" element={<ResetPassword />} />
      <Route path="verify" element={<Verify />} />
      <Route path="callback" element={<Callback />} />
      <Route index element={<Login />} />
    </Routes>
  )
}
