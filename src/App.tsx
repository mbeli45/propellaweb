import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import { I18nProvider } from './contexts/I18nContext'
import { DialogProvider } from './contexts/DialogContext'
import { BottomSheetProvider } from './contexts/BottomSheetContext'
import AppRoutes from './routes/AppRoutes'
import './lib/i18n'

function App() {
  return (
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
  )
}

export default App
