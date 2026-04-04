import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import { I18nProvider } from './contexts/I18nContext'
import { DialogProvider } from './contexts/DialogContext'
import { BottomSheetProvider } from './contexts/BottomSheetContext'
import AppRoutes from './routes/AppRoutes'
import AdminApp from './admin/App'
import ErrorBoundary from './components/ErrorBoundary'
import './lib/i18n'

function App() {
  // Check if we're on the admin subdomain
  const isAdminSubdomain = typeof window !== 'undefined' && 
    (window.location.hostname === 'admin.propellacam.com' || 
     window.location.hostname === 'admin.propella.cm' ||
     window.location.hostname === 'admin.propella.com')

  // On admin subdomain, render admin app directly without main router
  // React-admin's Admin component creates its own BrowserRouter internally
  if (isAdminSubdomain) {
    return (
      <ErrorBoundary>
        <HelmetProvider>
          <ThemeProvider>
            <I18nProvider>
              <AdminApp />
            </I18nProvider>
          </ThemeProvider>
        </HelmetProvider>
      </ErrorBoundary>
    )
  }

  // Main app with BrowserRouter
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <BrowserRouter>
          <ThemeProvider>
            <I18nProvider>
              <DialogProvider>
                <BottomSheetProvider>
                  <AuthProvider>
                    <AppRoutes />
                  </AuthProvider>
                </BottomSheetProvider>
              </DialogProvider>
            </I18nProvider>
          </ThemeProvider>
        </BrowserRouter>
      </HelmetProvider>
    </ErrorBoundary>
  )
}

export default App
