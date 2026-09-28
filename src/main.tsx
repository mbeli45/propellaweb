import React from 'react'
import ReactDOM from 'react-dom/client'
import * as Sentry from '@sentry/react'
import App from './App.tsx'
import './index.css'
import { initSentry } from './lib/sentry'

// Leave window.webkit untouched: iOS browsers own this native bridge and expose
// messageHandlers as read-only. Assigning to it aborts startup before React mounts.

// Initialize Sentry
initSentry()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={<div>An error has occurred</div>} showDialog>
      <App />
    </Sentry.ErrorBoundary>
  </React.StrictMode>,
)
