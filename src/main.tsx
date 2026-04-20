import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import './index.css'
import App from './App'
import { registerAuthLogout } from '@/services/api'
import { useAuthStore } from '@/stores/auth-store'

// Wire logout into the API interceptor (avoids circular import in api.ts)
registerAuthLogout((reason) => useAuthStore.getState().logout(reason as 'UNAUTHORIZED'))

// If this window was opened as an OAuth popup by the integrations flow, the
// backend redirects back to /integrations?connected=true|false on success/failure.
// Detect that we're a popup, signal the opener, and self-close before React mounts.
// Leading semicolon prevents ASI from treating this IIFE as a call on the result
// of the previous statement (which broke the app on load).
;(() => {
  try {
    if (typeof window === 'undefined' || !window.opener || window.opener === window) return
    const params = new URLSearchParams(window.location.search)
    const connected = params.get('connected')
    if (connected === 'true' || connected === 'false') {
      try {
        window.opener.postMessage(
          { type: 'integration-oauth-result', success: connected === 'true' },
          window.location.origin,
        )
      } catch {
        // best-effort; opener may be cross-origin in some setups
      }
      window.close()
    }
  } catch {
    // never let this block the app from rendering
  }
})()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <App />
        <Toaster position="top-right" richColors closeButton />
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>,
)
