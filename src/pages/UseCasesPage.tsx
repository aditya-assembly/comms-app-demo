import { useNavigate } from 'react-router-dom'
import { ArrowRight, Sparkle } from '@phosphor-icons/react'
import { LogoVoiceWaveIcon } from '@/components/Logo'
import { cn } from '@/lib/utils'

type DemoUseCase = {
  id: string
  title: string
  client: string
  summary: string
  ready: boolean
}

const USE_CASES: DemoUseCase[] = [
  {
    id: 'supplier-onboarding-domestic',
    title: 'Supplier / Contractor Onboarding — Domestic',
    client: 'AgileOne (MSP Program)',
    summary:
      'SPE-led onboarding with COI / W-9 / MSA / banking, validation, SPE review queue, SharePoint filing, and reminders — fully mocked.',
    ready: true,
  },
  {
    id: 'healthcare-credentialing',
    title: 'Healthcare credentialing packet',
    client: 'Example health system',
    summary: 'Payer and facility-specific documents with expirations — placeholder for a future demo.',
    ready: false,
  },
  {
    id: 'sow-change-order',
    title: 'SOW change order & rate updates',
    client: 'Example enterprise IT vendor',
    summary: 'Structured legal + finance review path — placeholder.',
    ready: false,
  },
]

export default function UseCasesPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      <header className="border-b border-[#E2E8F0] bg-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LogoVoiceWaveIcon size={32} />
          <div>
            <div className="text-sm font-bold text-gray-900">Comms demo</div>
            <div className="text-xs text-gray-500">Offline product walkthroughs — no API</div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-10">
        <div className="flex items-start gap-3 mb-8">
          <div className="p-2 rounded-xl bg-brand-ghost text-brand-indigo">
            <Sparkle size={22} weight="fill" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Use cases</h1>
            <p className="text-sm text-gray-500 mt-1 max-w-xl">
              Pick a scenario to open the same Comms shell as production, with scripted data. Only{' '}
              <span className="font-semibold text-gray-700">Supplier onboarding</span> is built end-to-end; others are
              coming soon.
            </p>
          </div>
        </div>

        <ul className="space-y-3">
          {USE_CASES.map((uc) => (
            <li key={uc.id}>
              <button
                type="button"
                disabled={!uc.ready}
                onClick={() => uc.ready && navigate('/app/agent')}
                className={cn(
                  'w-full text-left rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm transition-all',
                  uc.ready
                    ? 'hover:border-brand-indigo/30 hover:shadow-md cursor-pointer group'
                    : 'opacity-60 cursor-not-allowed',
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-brand-indigo">{uc.client}</div>
                    <h2 className="text-base font-bold text-gray-900 mt-1">{uc.title}</h2>
                    <p className="text-sm text-gray-500 mt-2 leading-relaxed">{uc.summary}</p>
                    {!uc.ready && (
                      <span className="inline-block mt-3 text-[11px] font-semibold text-gray-400">Coming soon</span>
                    )}
                  </div>
                  {uc.ready && (
                    <span className="shrink-0 flex items-center gap-1 text-xs font-bold text-brand-indigo group-hover:translate-x-0.5 transition-transform">
                      Open <ArrowRight size={14} weight="bold" />
                    </span>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}
