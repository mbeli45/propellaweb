import React from 'react'
import { Navigate, Routes, Route, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import Login from '@/pages/auth/Login'
import Signup from '@/pages/auth/Signup'
import ForgotPassword from '@/pages/auth/ForgotPassword'
import ResetPassword from '@/pages/auth/ResetPassword'
import Verify from '@/pages/auth/Verify'
import Callback from '@/pages/auth/Callback'

export default function AuthLayout() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (!loading && user && (location.pathname === '/auth' || location.pathname === '/auth/login')) {
    const targetRoute = user.role === 'agent' || user.role === 'landlord' ? '/agent' : '/user'
    return <Navigate to={targetRoute} replace />
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
