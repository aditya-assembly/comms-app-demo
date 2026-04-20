import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth-store'
import { LogoVoiceWaveIcon } from '@/components/Logo'

export default function SSOCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { completeSSOLogin } = useAuthStore()

  useEffect(() => {
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const redirectUri = `${window.location.origin}/sso-callback`
    if (!code || !state) { navigate('/login', { replace: true }); return }
    completeSSOLogin(code, state, redirectUri)
      .then(() => navigate('/app', { replace: true }))
      .catch(() => navigate('/login', { replace: true }))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <LogoVoiceWaveIcon size={48} />
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-indigo border-t-transparent" />
        <p className="text-sm text-gray-400">Completing sign in…</p>
      </div>
    </div>
  )
}
