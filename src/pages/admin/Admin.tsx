import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AdminApp from '@/admin/App';

// Let react-admin handle all authentication
// The authProvider will check access and redirect to login if needed
// This route is public - no app-level auth check needed
const Admin = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const isMainDomain = hostname === 'propellacam.com' || hostname === 'www.propellacam.com' || hostname === 'propella.cm';
      const isAdminSubdomain = hostname === 'admin.propellacam.com' || hostname === 'admin.propella.cm' || hostname === 'admin.propella.com';
      
      // If on main domain and trying to access /admin, redirect to admin subdomain
      if (isMainDomain && !isAdminSubdomain) {
        const protocol = window.location.protocol;
        const adminUrl = `${protocol}//admin.propella.com${location.pathname}${location.search}${location.hash}`;
        window.location.href = adminUrl;
        return;
      }

      // If on admin subdomain and path is /admin, redirect to root (react-admin handles routing)
      if (isAdminSubdomain && location.pathname === '/admin') {
        navigate('/', { replace: true });
        return;
      }
    }
  }, [location, navigate]);

  // If we're on the admin subdomain or localhost, render the admin app
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isAdminSubdomain = hostname === 'admin.propellacam.com' || 
                             hostname === 'admin.propella.cm' || 
                             hostname === 'admin.propella.com';
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    
    // Only render if on admin subdomain or localhost (for development)
    if (!isAdminSubdomain && !isLocalhost) {
      // Still redirecting, show loading
      return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div>Redirecting to admin panel...</div>
        </div>
      );
    }
  }

  // Always render AdminApp - react-admin will handle auth and routing
  return <AdminApp />;
};

export default Admin;
