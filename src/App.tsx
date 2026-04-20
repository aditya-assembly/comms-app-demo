import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { LandingPage } from '@/pages/LandingPage'
import LoginPage from '@/pages/LoginPage'
import SSOCallbackPage from '@/pages/SSOCallbackPage'
import AppPage from '@/pages/AppPage'
import UseCasesPage from '@/pages/UseCasesPage'

function SessionInit() {
  const { checkSession, isSessionChecked } = useAuthStore()
  useEffect(() => {
    if (!isSessionChecked) void checkSession()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

export default function App() {
  return (
    <>
      <SessionInit />
      <Routes>
        <Route path="/" element={<UseCasesPage />} />
        <Route path="/welcome" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/sso-callback" element={<SSOCallbackPage />} />
        <Route path="/app" element={<Navigate to="/app/agent" replace />} />
        <Route path="/app/dashboard" element={<Navigate to="/app/agent" replace />} />
        <Route
          path="/app/*"
          element={
            <ProtectedRoute>
              <AppPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<UseCasesPage />} />
      </Routes>
    </>
  )
}
