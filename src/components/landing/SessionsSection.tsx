import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Link as LinkIcon, Brain, MagnifyingGlass, Check, CaretRight, FileText, Star } from '@phosphor-icons/react'

const sessions = [
  {
    id: 'S-001',
    title: 'Vendor Onboarding — Q4 2024',
    cat: 'Collect',
    date: 'Oct 12',
    color: 'border-l-green-400',
    outcome: '18/18 complete',
    outcomeDetail: '18 W-9s · 18 NDAs · 18 insurance certs collected',
    outcomeColor: 'text-green-600',
    findings: [
      '18 W-9 forms collected and filed',
      '18 NDAs signed via e-sign',
      '18 insurance certificates verified',
    ],
    action: 'All contractors cleared to start Q4 project',
  },
  {
    id: 'S-002',
    title: 'Backend Engineering Screens',
    cat: 'Test',
    date: 'Jan 8',
    color: 'border-l-brand-indigo',
    outcome: '5 ranked',
    outcomeDetail: 'Torres 88 · Chen 84 · Park 71 · Nair 68 · Wilson 61',
    outcomeColor: 'text-brand-indigo',
    findings: [
      'Alex Torres: 88/100 — Advance to final',
      'Maria Chen: 84/100 — Advance to final',
      'James Park: 71/100 — Hold',
    ],
    action: 'Invites drafted for Torres & Chen · 3 decline emails queued',
  },
  {
    id: 'S-003',
    title: 'Team Roadmap Brainstorm',
    cat: 'Collect',
    date: 'Feb 2',
    color: 'border-l-violet-400',
    outcome: '47 ideas captured',
    outcomeDetail: '3 priority items · Top theme: developer tooling',
    outcomeColor: 'text-violet-600',
    findings: [
      '47 ideas from 14 participants',
      'Top priority: developer tooling (8 votes)',
      '3 items escalated to Q2 planning',
    ],
    action: 'Q2 roadmap draft pre-loaded with top 3 items',
  },
  {
    id: 'S-004',
    title: 'Q1 Compliance Training',
    cat: 'Review',
    date: 'Mar 1',
    color: 'border-l-yellow-400',
    outcome: '24/40 attested',
    outcomeDetail: '16 pending · 4 flagged for re-review',
    outcomeColor: 'text-yellow-600',
    findings: [
      '24 employees attested — all on record',
      '4 employees flagged for re-review',
      '16 follow-ups scheduled',
    ],
    action: 'Follow-ups sent · Deadline: Mar 15',
  },
]

const powerActions = [
  {
    icon: LinkIcon,
    title: 'Chain sessions',
    before: 'Vendor Onboarding Q4 →',
    after: '"Re-reach all 18 vendors and collect updated insurance certs for the new contract year."',
  },
  {
    icon: Brain,
    title: 'Use outcome as context',
    before: 'Backend Screens →',
    after: '"Based on the engineering screen outcomes, schedule final-round interviews for the top 2."',
  },
  {
    icon: MagnifyingGlass,
    title: 'Query across sessions',
    before: 'Any session →',
    after: '"Who across all our hiring sessions scored above 80? Build a candidate pipeline report."',
  },
]

export function SessionsSection() {
  const [activeSession, setActiveSession] = useState(sessions[1].id)
  const current = sessions.find(s => s.id === activeSession)!

  return (
    <section id="sessions" className="py-24 bg-[#0D1117] text-white overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">

        {/* Header */}
        <div className="mb-14 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <div className="tag bg-white/10 text-white/70 border border-white/10 mb-4">Comms Sessions</div>
            <h2 className="text-5xl font-bold leading-tight">
              Dispatch creates a Comms Session.<br />
              <span className="text-brand-pale">Here's what lives inside it.</span>
            </h2>
            <p className="mt-4 text-white/50 leading-relaxed text-lg max-w-xl">
              When you accept a Comms draft and hit send, a <strong className="text-white/80">Comms Session</strong> is created. It tracks who received it, handles follow-ups automatically, and stores everything that comes back — documents, answers, decisions. When the work is done, the outcome is attached and stays on record.
            </p>
          </div>
          <Link to="/app/sessions" className="btn-primary bg-white text-brand-indigo hover:bg-brand-ghost shrink-0">
            Browse Comms Sessions <ArrowRight size={14} weight="bold" />
          </Link>
        </div>

        {/* How a Comms Session works — 3-step journey */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-12">
          {[
            { step: '01', label: 'You accept the Comms draft', sub: 'Invites go out via email, SMS, or phone — sync or async.' },
            { step: '02', label: 'Session runs automatically', sub: 'Tracks responses, sends follow-ups, flags exceptions. No manual chasing.' },
            { step: '03', label: 'Outcome attached when done', sub: 'Summary, findings, scores, and next actions — all on record.' },
          ].map((item, i, arr) => (
            <div key={item.step} className="flex items-center gap-2 flex-1">
              <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-4">
                <div className="text-[10px] font-bold text-brand-pale/60 uppercase tracking-wider mb-1.5">Step {item.step}</div>
                <div className="text-sm font-semibold text-white mb-1">{item.label}</div>
                <p className="text-xs text-white/50 leading-relaxed">{item.sub}</p>
              </div>
              {i < arr.length - 1 && (
                <ArrowRight size={16} className="text-white/20 shrink-0 hidden sm:block" />
              )}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-[1fr_1fr] gap-8">

          {/* Left: Session list */}
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-white/30 uppercase tracking-widest mb-4">Recent Comms Sessions</div>
            {sessions.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveSession(s.id)}
                className={`w-full text-left bg-white/5 hover:bg-white/[0.07] border rounded-xl px-4 py-4 border-l-2 ${s.color} transition-all ${
                  activeSession === s.id ? 'border-r border-t border-b border-white/20' : 'border-r border-t border-b border-white/10'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white">{s.title}</div>
                    <div className="text-xs text-white/40 mt-0.5">{s.cat} · {s.date}</div>
                  </div>
                  <div className="shrink-0 text-right ml-3">
                    <div className={`text-xs font-bold ${s.outcomeColor}`}>{s.outcome}</div>
                    <CaretRight size={12} weight="bold" className={`ml-auto mt-1 transition-transform ${activeSession === s.id ? 'text-brand-pale rotate-90' : 'text-white/20'}`} />
                  </div>
                </div>
                <div className="mt-2 text-[11px] text-white/40">{s.outcomeDetail}</div>
              </button>
            ))}

            {/* Power actions */}
            <div className="pt-4 space-y-2">
              <div className="text-[11px] font-bold text-white/30 uppercase tracking-widest mb-3">Reuse outcomes</div>
              {powerActions.map(a => {
                const Icon = a.icon
                return (
                  <div key={a.title} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-brand-pale/30 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon size={12} className="text-brand-pale" />
                      <span className="text-xs font-bold text-white/60">{a.before}</span>
                    </div>
                    <p className="text-sm text-white/50 italic leading-relaxed">{a.after}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right: Session outcome detail */}
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/10 bg-white/[0.03]">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Check size={9} weight="bold" className="text-green-400" />
                </div>
                <span className="text-xs font-bold text-green-400">Session Outcome</span>
              </div>
              <div className="text-base font-bold text-white">{current.title}</div>
              <div className="text-xs text-white/40 mt-0.5">{current.cat} · {current.date}</div>
            </div>

            {/* Key findings */}
            <div className="px-6 py-5 border-b border-white/10">
              <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3">Key Findings</div>
              <div className="space-y-2.5">
                {current.findings.map((f, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-brand-indigo/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={9} weight="bold" className="text-brand-pale" />
                    </div>
                    <span className="text-sm text-white/70 leading-snug">{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Generated next action */}
            <div className="px-6 py-5 border-b border-white/10">
              <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3">Generated Action</div>
              <div className="flex items-start gap-3 bg-brand-indigo/10 border border-brand-pale/20 rounded-xl px-4 py-3">
                <Star size={14} weight="fill" className="text-brand-pale shrink-0 mt-0.5" />
                <span className="text-sm text-white/80 leading-relaxed">{current.action}</span>
              </div>
            </div>

            {/* Use as context */}
            <div className="px-6 py-5">
              <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3">Reuse This Outcome</div>
              <div className="space-y-2">
                <button className="w-full flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-3 transition-colors text-left">
                  <Brain size={13} weight="duotone" className="text-brand-pale shrink-0" />
                  <span className="text-sm text-white/70">Use as context in Work Dispatcher</span>
                  <CaretRight size={12} weight="bold" className="text-white/30 ml-auto" />
                </button>
                <button className="w-full flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-3 transition-colors text-left">
                  <LinkIcon size={13} className="text-brand-pale shrink-0" />
                  <span className="text-sm text-white/70">Chain to a new session</span>
                  <CaretRight size={12} weight="bold" className="text-white/30 ml-auto" />
                </button>
                <button className="w-full flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-3 transition-colors text-left">
                  <FileText size={13} className="text-brand-pale shrink-0" />
                  <span className="text-sm text-white/70">Export outcome report</span>
                  <CaretRight size={12} weight="bold" className="text-white/30 ml-auto" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
