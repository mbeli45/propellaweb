import React from 'react'
import ReactDOM from 'react-dom/client'
import * as Sentry from '@sentry/react'
import App from './App.tsx'
import './index.css'
import { initSentry } from './lib/sentry'

// In WKWebView-based browsers (e.g. Facebook iOS), window.webkit.messageHandlers
// exists but specific handler names may not be registered. Proxy unknown handlers
// to a no-op so third-party libraries don't throw when probing for native bridges.
if (typeof window !== 'undefined' && window.webkit?.messageHandlers) {
  window.webkit.messageHandlers = new Proxy(window.webkit.messageHandlers, {
    get(target, prop) {
      return (prop in target) ? target[prop as string] : { postMessage: () => {} };
    },
  });
}

// Initialize Sentry
initSentry()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={<div>An error has occurred</div>} showDialog>
      <App />
    </Sentry.ErrorBoundary>
  </React.StrictMode>,
)
