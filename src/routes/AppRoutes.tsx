import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import GuestLayout from '@/layouts/GuestLayout'
import UserLayout from '@/layouts/UserLayout'
import AgentLayout from '@/layouts/AgentLayout'
import AuthLayout from '@/layouts/AuthLayout'
import LoadingScreen from '@/components/LoadingScreen'
import PropertyDetail from '@/pages/property/[id]'
import AddProperty from '@/pages/property/add'
import EditProperty from '@/pages/property/edit/[id]'
import ChatDetail from '@/pages/chat/[id]'
import AgentProfilePage from '@/pages/agent/[id]'
import Terms from '@/pages/profile/help/Terms'
import Privacy from '@/pages/profile/help/Privacy'
import FAQ from '@/pages/profile/help/FAQ'

function AppRoutes() {
  const { user, loading } = useAuth()

  // Debug logging
  console.log('🔐 [AppRoutes] User:', user?.email, '| Role:', user?.role, '| Loading:', loading)

  if (loading) {
    return <LoadingScreen />
  }

  // Determine which layout to use based on user role
  const getDefaultRoute = () => {
    if (!user) return '/guest'
    if (user.role === 'agent' || user.role === 'landlord') return '/agent'
    return '/user'
  }

  return (
    <Routes>
      {/* Auth routes */}
      <Route path="/auth/*" element={<AuthLayout />} />

      {/* Guest routes */}
      <Route path="/guest/*" element={<GuestLayout />} />

      {/* User routes */}
      <Route path="/user/*" element={user ? <UserLayout /> : <Navigate to="/guest" />} />

      {/* Agent routes */}
      <Route path="/agent/*" element={user?.role === 'agent' || user?.role === 'landlord' ? <AgentLayout /> : <Navigate to="/user" />} />

      {/* Public agent profile route (accessible to all) */}
      <Route path="/agents/:id" element={<AgentProfilePage />} />

      {/* Property routes (accessible to all) */}
      <Route path="/property/:id" element={<PropertyDetail />} />
      <Route path="/property/add" element={user?.role === 'agent' || user?.role === 'landlord' ? <AddProperty /> : <Navigate to="/auth/login" />} />
      <Route path="/property/edit/:id" element={user?.role === 'agent' || user?.role === 'landlord' ? <EditProperty /> : <Navigate to="/auth/login" />} />
      
      {/* Chat routes */}
      <Route path="/chat/:id" element={user ? <ChatDetail /> : <Navigate to="/auth/login" />} />

      {/* Public pages - Terms, Privacy, and FAQ */}
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/faq" element={<FAQ />} />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />
      <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
    </Routes>
  )
}

export default AppRoutes
