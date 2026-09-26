import { useRef } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { pendingClientInvitation } from '@/lib/clientInvitation'
import ClientDealInvitation from '@/pages/ClientDealInvitation'
import GuestLayout from '@/layouts/GuestLayout'
import UserLayout from '@/layouts/UserLayout'
import AgentLayout from '@/layouts/AgentLayout'
import AuthLayout from '@/layouts/AuthLayout'
import LoadingScreen from '@/components/LoadingScreen'
import Landing from '@/pages/Landing'
import PropertyDetail from '@/pages/property/[id]'
import AddProperty from '@/pages/property/add'
import EditProperty from '@/pages/property/edit/[id]'
import ChatDetail from '@/pages/chat/[id]'
import AgentProfilePage from '@/pages/agent/[id]'
import Terms from '@/pages/profile/help/Terms'
import Privacy from '@/pages/profile/help/Privacy'
import FAQ from '@/pages/profile/help/FAQ'
import Support from '@/pages/support/Support'
import Admin from '@/pages/admin/Admin'

function AppRoutes() {
  const { user, loading } = useAuth()
  const location = useLocation()
  // Only the first session check blocks the app. Later auth events (the SIGNED_IN
  // right after an OAuth code exchange, token refreshes) also flip `loading`, and
  // swapping the whole tree for a spinner then would unmount /auth/callback mid-flow.
  const bootedRef = useRef(false)
  if (!loading) bootedRef.current = true

  if (loading && !bootedRef.current) {
    return <LoadingScreen />
  }

  // Determine which layout to use based on user role
  const getDefaultRoute = () => {
    if (!user) return '/'
    if (user.role === 'agent' || user.role === 'landlord') return '/agent'
    return '/user'
  }

  // Apple's form_post flow in particular can bring the user back to the Site URL
  // root (`/?code=...`) instead of /auth/callback. Nothing on the landing page
  // finishes sign-in (profile creation, pending role), so a first-time user ends up
  // signed in without a profile and sees the landing page. Forward any OAuth
  // response to the callback. Auth pages are excluded: password-reset and email
  // links carry `?code=` too and handle it themselves.
  const oauthParams = `${location.search}${location.hash}`
  const isOAuthResponse =
    /[?&#](code|error|error_description|access_token)=/.test(oauthParams) && !/type=recovery/.test(oauthParams)
  if (isOAuthResponse && !location.pathname.startsWith('/auth/') && !location.pathname.startsWith('/admin')) {
    return <Navigate to={`/auth/callback${location.search}${location.hash}`} replace />
  }

  // A client who opened a deal invitation link before signing in finishes it after auth.
  const inviteExempt = ['/deal-invite', '/auth/', '/admin'].some((path) => location.pathname.startsWith(path))
  if (user && pendingClientInvitation() && !inviteExempt) return <Navigate to="/deal-invite" replace />
  return (
    <Routes>
      {/* Client deal invitation (private link from an admin) */}
      <Route path="/deal-invite" element={<ClientDealInvitation />} />
      {/* Landing Page - Public */}
      <Route path="/" element={!user ? <Landing /> : <Navigate to={getDefaultRoute()} replace />} />

      {/* Admin routes - Public, react-admin handles its own auth */}
      <Route path="/admin/*" element={<Admin />} />

      {/* Auth routes */}
      <Route path="/auth/*" element={<AuthLayout />} />

      {/* Guest routes */}
      <Route path="/guest/*" element={<GuestLayout />} />

      {/* User routes */}
      <Route path="/user/*" element={user ? <UserLayout /> : <Navigate to="/" />} />

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
      <Route path="/support" element={<Support />} />

      {/* Fallback redirect */}
      <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
    </Routes>
  )
}

export default AppRoutes
