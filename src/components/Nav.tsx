import { Link, useLocation } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { LogoVoiceWaveIcon } from './Logo'

const navLinks = [
  { label: 'How It Works', href: '/#modes' },
  { label: 'Use Cases', href: '/#use-cases' },
]

export function Nav() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const isApp = location.pathname.startsWith('/app')
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
      <div className="section-container">
        <div className="flex items-center justify-between h-14">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <LogoVoiceWaveIcon size={30} />
            <span className="font-bold text-gray-900 text-base" style={{ letterSpacing: '-0.02em' }}>Comms</span>
          </Link>

          {/* Marketing nav */}
          {!isApp && (
            <div className="hidden md:flex items-center gap-7">
              {navLinks.map(l => (
                l.href.startsWith('/#')
                  ? <a key={l.href} href={l.href} className="text-sm font-medium text-gray-400 hover:text-brand-indigo transition-colors">{l.label}</a>
                  : <Link key={l.href} to={l.href} className="text-sm font-medium text-gray-400 hover:text-brand-indigo transition-colors">{l.label}</Link>
              ))}
              <Link to="/developer" className="text-sm font-medium text-gray-400 hover:text-brand-indigo transition-colors">Developers</Link>
            </div>
          )}

          {/* Right actions */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            {isApp ? (
              <Link to="/" className="text-sm font-medium text-gray-400 hover:text-brand-indigo transition-colors">← Back</Link>
            ) : (
              <Link to="/app" className="btn-primary py-2 text-sm">Open Work Dispatcher</Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <button ref={ref as unknown as React.RefObject<HTMLButtonElement>} className="md:hidden p-1.5 text-gray-400" onClick={() => setMenuOpen(!menuOpen)}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-6 py-4 space-y-1">
          {!isApp && navLinks.map(l => (
            l.href.startsWith('/#')
              ? <a key={l.href} href={l.href} className="block text-sm font-medium text-gray-600 py-2 hover:text-brand-indigo" onClick={() => setMenuOpen(false)}>{l.label}</a>
              : <Link key={l.href} to={l.href} className="block text-sm font-medium text-gray-600 py-2 hover:text-brand-indigo" onClick={() => setMenuOpen(false)}>{l.label}</Link>
          ))}
          <div className="pt-3 border-t border-gray-100">
            {isApp
              ? <Link to="/" className="block text-sm font-medium text-gray-600 py-2 hover:text-brand-indigo" onClick={() => setMenuOpen(false)}>← Back to home</Link>
              : <Link to="/app" className="btn-primary w-full justify-center text-sm" onClick={() => setMenuOpen(false)}>Open Work Dispatcher</Link>}
          </div>
        </div>
      )}
    </nav>
  )
}
