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
import Admin from '@/pages/admin/Admin'

function AppRoutes() {
  const { user, loading } = useAuth()

  // Debug logging
  console.log('🔐 [AppRoutes] User:', user?.email, '| Role:', user?.role, '| Loading:', loading)

  if (loading) {
    return <LoadingScreen />
  }

  // Check if we're on the admin subdomain
  const isAdminSubdomain = typeof window !== 'undefined' && 
    (window.location.hostname === 'admin.propellacam.com' || 
     window.location.hostname === 'admin.propella.cm')

  // Determine which layout to use based on user role
  const getDefaultRoute = () => {
    // If on admin subdomain, go to root (which maps to admin)
    if (isAdminSubdomain) return '/'
    
    if (!user) return '/guest'
    if (user.role === 'agent' || user.role === 'landlord') return '/agent'
    return '/user'
  }

  return (
    <Routes>
      {/* Admin routes - Public, react-admin handles its own auth */}
      {/* Support both /admin/* and root /* when on admin subdomain */}
      {isAdminSubdomain ? (
        <Route path="/*" element={<Admin />} />
      ) : (
        <Route path="/admin/*" element={<Admin />} />
      )}

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
