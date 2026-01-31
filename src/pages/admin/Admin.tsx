import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import AdminApp from '@/admin/App';

// Let react-admin handle all authentication
// The authProvider will check access and redirect to login if needed
// This route is public - no app-level auth check needed
const Admin = () => {
  const location = useLocation();

  useEffect(() => {
    // Check if we're on the main domain (not admin subdomain)
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const isMainDomain = hostname === 'propellacam.com' || hostname === 'www.propellacam.com' || hostname === 'propella.cm';
      const isAdminSubdomain = hostname === 'admin.propellacam.com' || hostname === 'admin.propella.cm';
      
      // If on main domain and trying to access /admin, redirect to admin subdomain
      if (isMainDomain && !isAdminSubdomain) {
        const protocol = window.location.protocol;
        const adminUrl = `${protocol}//admin.propellacam.com${location.pathname}${location.search}${location.hash}`;
        window.location.href = adminUrl;
        return;
      }
    }
  }, [location]);

  // If we're on the admin subdomain or localhost, render the admin app
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isAdminSubdomain = hostname === 'admin.propellacam.com' || hostname === 'admin.propella.cm';
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

  return <AdminApp />;
};

export default Admin;
