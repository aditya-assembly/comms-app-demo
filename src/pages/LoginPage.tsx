import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/stores/auth-store'
import { LogoVoiceWaveIcon } from '@/components/Logo'
import { Mail, Shield, LogIn, ArrowLeft, CheckCircle, Clock, RefreshCw, Lock } from 'lucide-react'

function generateSecureOAuthState(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

function OTPInput({
  value, onChange, length = 7, disabled = false, onComplete,
}: {
  value: string; onChange: (v: string) => void; length?: number; disabled?: boolean; onComplete?: () => void
}) {
  const [active, setActive] = useState(0)
  const refs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => { if (refs.current[0] && !disabled) refs.current[0].focus() }, [disabled])

  useEffect(() => {
    const handle = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' && !target.closest('.otp-container')) return
      e.preventDefault()
      const pasted = (e.clipboardData?.getData('text') || '').replace(/\D/g, '').slice(0, length)
      if (!pasted) return
      onChange(pasted)
      const next = Math.min(pasted.length - 1, length - 1)
      setActive(next); refs.current[next]?.focus()
      if (pasted.length === length && onComplete) setTimeout(onComplete, 0)
    }
    document.addEventListener('paste', handle)
    return () => document.removeEventListener('paste', handle)
  }, [length, onChange, onComplete])

  const handleChange = (i: number, v: string) => {
    if (v.length > 1) {
      const p = v.slice(0, length)
      onChange(p)
      const next = Math.min(p.length - 1, length - 1)
      setActive(next); refs.current[next]?.focus()
      return
    }
    if (v.match(/^[0-9]$/)) {
      const a = value.split(''); a[i] = v; onChange(a.join(''))
      if (i < length - 1) { setActive(i + 1); refs.current[i + 1]?.focus() }
      else if (i === length - 1 && a.join('').length === length && onComplete) setTimeout(onComplete, 0)
    }
  }

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace') {
      if (value[i]) { const a = value.split(''); a[i] = ''; onChange(a.join('')) }
      else if (i > 0) {
        setActive(i - 1); refs.current[i - 1]?.focus()
        const a = value.split(''); a[i - 1] = ''; onChange(a.join(''))
      }
    } else if (e.key === 'ArrowLeft' && i > 0) { setActive(i - 1); refs.current[i - 1]?.focus() }
    else if (e.key === 'ArrowRight' && i < length - 1) { setActive(i + 1); refs.current[i + 1]?.focus() }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    onChange(p)
    const next = Math.min(p.length - 1, length - 1)
    setActive(next); refs.current[next]?.focus()
    if (p.length === length && onComplete) setTimeout(onComplete, 0)
  }

  return (
    <div className="otp-container">
      <div className="flex gap-1.5 sm:gap-2 justify-center mb-4">
        {Array.from({ length }, (_, i) => (
          <input
            key={i}
            ref={(r) => (refs.current[i] = r)}
            type="text" inputMode="numeric" pattern="[0-9]*" maxLength={1}
            value={value[i] || ''}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onFocus={() => setActive(i)}
            onPaste={handlePaste}
            disabled={disabled}
            className={[
              'w-11 h-11 sm:w-13 sm:h-13 text-center text-lg font-bold border-2 rounded-xl',
              'transition-all duration-200 outline-none',
              active === i
                ? 'border-brand-indigo ring-2 ring-brand-indigo/30 bg-brand-ghost scale-105'
                : 'border-gray-200 hover:border-gray-300 bg-white',
              value[i] ? 'bg-brand-ghost border-brand-indigo/60' : '',
              disabled ? 'opacity-50 cursor-not-allowed' : '',
            ].filter(Boolean).join(' ')}
          />
        ))}
      </div>
      <div className="text-center text-sm text-gray-400 flex items-center justify-center gap-1.5">
        <Clock className="w-4 h-4" />
        <span>Code expires in 10 minutes</span>
      </div>
    </div>
  )
}

function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path fill="#4285F4" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.18 17.74 9.5 24 9.5z"/>
      <path fill="#34A853" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.16 7.09-10.27 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#EA4335" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.21-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  )
}

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { generateOTP, loginWithOTP, getSSOAuthorizeUrl, isAuthenticated } = useAuthStore()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSSOLoading, setIsSSOLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otpSentForEmail, setOtpSentForEmail] = useState<string | null>(null)
  const [cooldownEnd, setCooldownEnd] = useState<number | null>(null)
  const [cooldownSeconds, setCooldownSeconds] = useState(0)
  const [cooldownEmail, setCooldownEmail] = useState<string | null>(null)
  const [showSSOEmailStep, setShowSSOEmailStep] = useState(false)
  const [ssoEmail, setSsoEmail] = useState('')

  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as { from?: { pathname: string; search: string } })?.from
      navigate(from ? `${from.pathname}${from.search || ''}` : '/app', { replace: true })
    }
  }, [isAuthenticated, navigate, location.state])

  useEffect(() => {
    if (!cooldownEnd) return
    const iv = setInterval(() => {
      const rem = Math.ceil((cooldownEnd - Date.now()) / 1000)
      if (rem <= 0) { setCooldownEnd(null); setCooldownSeconds(0); setCooldownEmail(null); setOtpSentForEmail(null); clearInterval(iv) }
      else setCooldownSeconds(rem)
    }, 1000)
    return () => clearInterval(iv)
  }, [cooldownEnd])

  const handleGenerateOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) { setError('Please enter your email.'); return }
    if (otpSentForEmail === email) { setOtpSent(true); setError(''); return }
    if (cooldownEnd && Date.now() < cooldownEnd && cooldownEmail === email) { setError('Please wait before requesting another code.'); return }
    setError(''); setIsLoading(true)
    try {
      await generateOTP(email)
      setOtpSent(true); setOtpSentForEmail(email)
      const end = Date.now() + 60_000; setCooldownEnd(end); setCooldownSeconds(60); setCooldownEmail(email)
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to send code') }
    finally { setIsLoading(false) }
  }

  const handleLoginWithOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !code) { setError('Please enter your email and code.'); return }
    setError(''); setIsLoading(true)
    try {
      await loginWithOTP(email, code)
      const from = (location.state as { from?: { pathname: string; search: string } })?.from
      navigate(from ? `${from.pathname}${from.search || ''}` : '/app')
    } catch (err) { setError(err instanceof Error ? err.message : 'Login failed') }
    finally { setIsLoading(false) }
  }

  const handleSSO = async (provider: string) => {
    if (provider === 'saml') { setShowSSOEmailStep(true); setSsoEmail(''); setError(''); return }
    setError(''); setIsSSOLoading(true)
    try {
      const state = generateSecureOAuthState()
      const redirectUri = `${window.location.origin}/sso-callback`
      const url = await getSSOAuthorizeUrl({ provider, state, redirectUri })
      window.location.href = url
    } catch (err) { setError(err instanceof Error ? err.message : 'SSO failed'); setIsSSOLoading(false) }
  }

  const handleSSOEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = ssoEmail.trim().toLowerCase()
    if (!trimmed || !trimmed.includes('@')) { setError('Enter a valid work email.'); return }
    const domain = trimmed.split('@')[1]
    if (!domain) { setError('Enter a valid work email.'); return }
    setError(''); setIsSSOLoading(true)
    try {
      const state = generateSecureOAuthState()
      const redirectUri = `${window.location.origin}/sso-callback`
      const url = await getSSOAuthorizeUrl({ provider: 'saml', state, redirectUri, email: trimmed, domain })
      window.location.href = url
    } catch (err) { setError(err instanceof Error ? err.message : 'SSO failed'); setIsSSOLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-white to-brand-ghost flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="w-full max-w-sm sm:max-w-md"
      >
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-6 sm:p-8">
          {/* Logo & title */}
          <div className="flex flex-col items-center gap-3 mb-8">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }}>
              <LogoVoiceWaveIcon size={48} />
            </motion.div>
            <h1 className="text-2xl font-bold text-gray-900" style={{ letterSpacing: '-0.02em' }}>Comms</h1>
          </div>

          <AnimatePresence mode="wait">
            {showSSOEmailStep ? (
              <motion.form key="sso-email" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleSSOEmailSubmit} className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-ghost rounded-full text-sm font-medium text-brand-indigo mb-2">
                  <Shield className="w-4 h-4" /> Enter your work email for SSO
                </div>
                {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
                <div className="relative border-2 border-gray-200 focus-within:border-brand-indigo rounded-xl transition-colors bg-white">
                  <div className="absolute left-3 inset-y-0 flex items-center pointer-events-none"><Mail className="h-4 w-4 text-gray-400" /></div>
                  <input type="email" placeholder="you@company.com" value={ssoEmail} onChange={(e) => setSsoEmail(e.target.value)}
                    className="w-full pl-10 pr-4 h-12 bg-transparent text-sm outline-none" disabled={isSSOLoading} required />
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => { setShowSSOEmailStep(false); setSsoEmail(''); setError('') }}
                    className="flex-1 h-12 rounded-xl border-2 border-gray-200 text-sm font-medium flex items-center justify-center gap-2 hover:border-gray-300 transition-colors" disabled={isSSOLoading}>
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <button type="submit" className="flex-1 h-12 rounded-xl btn-primary justify-center" disabled={isSSOLoading}>
                    {isSSOLoading ? <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Shield className="w-4 h-4" /> Continue</>}
                  </button>
                </div>
              </motion.form>
            ) : !otpSent ? (
              <motion.form key="email-form" id="email-form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleGenerateOTP} className="space-y-4">
                <button type="button" onClick={() => handleSSO('saml')} disabled={isSSOLoading}
                  className="w-full h-12 rounded-xl border-2 border-gray-200 text-sm font-medium flex items-center justify-center gap-2 hover:border-brand-indigo/40 hover:bg-brand-ghost transition-colors">
                  <Shield className="w-5 h-5 text-brand-indigo shrink-0" /> Sign in with SSO
                </button>
                <button type="button" onClick={() => handleSSO('google')} disabled={isSSOLoading}
                  className="w-full h-12 rounded-xl border-2 border-gray-200 text-sm font-medium flex items-center justify-center gap-2 hover:border-gray-300 transition-colors">
                  <GoogleLogo className="shrink-0" /> Sign in with Google
                </button>

                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-200" /></div>
                  <div className="relative flex justify-center text-xs text-gray-400"><span className="bg-white px-2">or continue with email</span></div>
                </div>

                <div className="relative border-2 border-gray-200 focus-within:border-brand-indigo rounded-xl transition-colors">
                  <div className="absolute left-3 inset-y-0 flex items-center pointer-events-none"><Mail className="h-4 w-4 text-gray-400" /></div>
                  <input type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 h-12 bg-transparent text-sm outline-none" disabled={isLoading} required />
                </div>

                {error && <motion.p initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</motion.p>}

                <button type="submit" disabled={isLoading}
                  className="w-full h-12 btn-primary justify-center rounded-xl shadow-md hover:shadow-lg transition-shadow">
                  {isLoading
                    ? <><span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending…</>
                    : otpSentForEmail === email
                      ? <><ArrowLeft className="w-4 h-4" /> Enter Code</>
                      : <><LogIn className="w-4 h-4" /> Send Verification Code</>}
                </button>

                <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
                  <Lock className="w-3 h-3" /> Protected by two-factor authentication
                </div>
              </motion.form>
            ) : (
              <motion.form key="otp-form" id="otp-form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleLoginWithOTP} className="space-y-5">
                <div className="flex items-center h-12 border-2 border-gray-200 rounded-xl bg-gray-50 px-3 gap-2">
                  <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="flex-1 text-sm truncate text-gray-700">{email}</span>
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                  </div>
                </div>

                <div className="text-center space-y-1">
                  <p className="text-base font-semibold text-gray-900">Verification Code</p>
                  <p className="text-sm text-gray-400">Enter the 7-digit code sent to your email</p>
                </div>

                <OTPInput value={code} onChange={setCode} length={7} disabled={isLoading}
                  onComplete={() => { const f = document.querySelector('#otp-form') as HTMLFormElement; f?.requestSubmit() }} />

                {error && <motion.p initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</motion.p>}

                <button type="submit" disabled={isLoading || code.length !== 7}
                  className="w-full h-12 btn-primary justify-center rounded-xl shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
                  {isLoading
                    ? <><span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Signing in…</>
                    : <><CheckCircle className="w-4 h-4" /> Sign In</>}
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => { setOtpSent(false); setCode(''); setError('') }} disabled={isLoading}
                    className="h-11 rounded-xl border-2 border-gray-200 text-sm font-medium flex items-center justify-center gap-1.5 hover:border-gray-300 transition-colors disabled:opacity-50">
                    <ArrowLeft className="w-4 h-4" /> Change Email
                  </button>
                  <button type="button" onClick={handleGenerateOTP} disabled={isLoading || (cooldownSeconds > 0 && cooldownEmail === email)}
                    className="h-11 rounded-xl border-2 border-gray-200 text-sm font-medium flex items-center justify-center gap-1.5 hover:border-gray-300 transition-colors disabled:opacity-50">
                    {cooldownSeconds > 0
                      ? <><Clock className="w-4 h-4" /> Resend ({cooldownSeconds}s)</>
                      : <><RefreshCw className="w-4 h-4" /> Resend OTP</>}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center mt-4 text-xs text-gray-400">Secure access to your Comms workspace</p>
      </motion.div>
    </div>
  )
}
