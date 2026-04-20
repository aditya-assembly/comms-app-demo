import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, VideoCamera, ChatTeardropText, Microphone, Phone,
  Check, Circle, Archive, PencilSimple, ArrowsLeftRight,
} from '@phosphor-icons/react'

/* ─── Large Previews ─── */

function DispatcherPreview() {
  return (
    <div className="flex h-full gap-3">
      <div className="w-44 bg-[#F7F7F9] rounded-xl border border-gray-100 flex flex-col p-3 shrink-0">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Sessions</div>
        {[
          { label: 'Vendor onboarding', count: '9/12', dot: 'bg-green-400' },
          { label: 'COI verification', count: '22/30', dot: 'bg-brand-indigo', pulse: true },
          { label: 'Q1 policy attestations', count: '24/40', dot: 'bg-yellow-400', pulse: true },
        ].map(s => (
          <div key={s.label} className="flex items-start gap-2 px-2 py-2.5 rounded-lg hover:bg-white cursor-pointer mb-0.5">
            <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${s.dot} ${s.pulse ? 'animate-pulse' : ''}`} />
            <div>
              <div className="text-sm font-medium text-gray-800 truncate">{s.label}</div>
              <div className="text-xs text-gray-400">{s.count}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex-1 bg-white rounded-xl border border-gray-100 flex flex-col">
        <div className="px-4 py-3 border-b border-gray-100 text-sm font-semibold text-gray-800">Work Dispatcher</div>
        <div className="flex-1 px-4 py-3 space-y-2.5 overflow-hidden flex flex-col min-h-0">
          <div className="flex justify-end shrink-0">
            <div className="bubble-user text-sm max-w-[13rem] leading-snug">
              Onboard the 12 new suppliers — collect W-9, COI, NDA, and banking for each.
            </div>
          </div>
          <div className="flex gap-2 items-start shrink-0">
            <div className="w-6 h-6 rounded-lg bg-brand-indigo flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-[10px] text-white font-bold">AI</span>
            </div>
            <div className="bubble-agent text-[13px] max-w-[14rem] leading-snug">
              Configure the conversation and delivery first. I'll generate a Comms draft — a structured agenda — for you to review before invites send.
            </div>
          </div>
          <div className="rounded-xl border border-brand-indigo/20 bg-white p-2.5 shadow-sm shrink-0">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Review Comms</div>
            <div className="text-[11px] font-bold text-brand-shaft mt-0.5">Vendor onboarding × 12</div>
            <ol className="mt-1.5 space-y-1 text-[10px] text-gray-600 list-decimal pl-3.5">
              <li>Opening & identity — confirm entity & contacts</li>
              <li>Structured checklist — docs & read-backs</li>
              <li>Exceptions — route gaps to procurement</li>
            </ol>
            <div className="flex gap-1.5 mt-2">
              <span className="flex-1 text-center py-1 rounded-md border border-gray-200 text-[10px] font-semibold text-gray-500 flex items-center justify-center gap-0.5">
                <PencilSimple size={9} /> Edit
              </span>
              <span className="flex-1 text-center py-1 rounded-md bg-brand-indigo text-[10px] font-bold text-white">
                Accept & send
              </span>
            </div>
          </div>
          <div className="flex justify-center shrink-0">
            <div className="text-[11px] font-semibold text-brand-indigo bg-brand-ghost px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <Check size={11} weight="bold" /> Accepted — Comms Session live · invites queued
            </div>
          </div>
        </div>
        <div className="px-3 py-3 border-t border-gray-100">
          <div className="flex items-center gap-2 bg-[#F3F4F6] rounded-xl px-3 py-2.5">
            <Microphone size={13} className="text-gray-400" />
            <span className="text-sm text-gray-400 flex-1">Describe what you need...</span>
            <div className="w-7 h-7 rounded-lg bg-brand-indigo flex items-center justify-center">
              <ArrowRight size={12} className="text-white" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SyncPreview() {
  return (
    <div className="flex gap-3 h-full">
      <div className="w-48 bg-[#0D1117] rounded-xl border border-white/10 p-4 flex flex-col shrink-0">
        <div className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Agenda</div>
        {[
          { label: 'Opening & consent', done: true },
          { label: 'Scope & requirements', done: true },
          { label: 'Evidence walk-through', current: true },
          { label: 'Risks & exceptions', done: false },
          { label: 'Logistics & close', done: false },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-2.5 py-2">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
              item.done ? 'bg-green-500' : item.current ? 'bg-brand-indigo' : 'bg-white/10'
            }`}>
              {item.done ? <Check size={9} weight="bold" className="text-white" /> : item.current ? <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> : <Circle size={9} className="text-white/30" />}
            </div>
            <span className={`text-sm ${item.current ? 'text-white font-semibold' : item.done ? 'text-white/30 line-through' : 'text-white/40'}`}>
              {item.label}
            </span>
          </div>
        ))}
        <div className="mt-auto">
          <div className="flex justify-between text-xs text-white/30 mb-1.5">
            <span>Progress</span><span>60%</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-brand-indigo rounded-full w-3/5" />
          </div>
        </div>
      </div>

      <div className="flex-1 bg-gradient-to-br from-[#1D2476] to-[#0A0E27] rounded-xl flex flex-col items-center justify-center gap-4 p-5">
        <div className="text-xs font-bold bg-green-500/20 text-green-300 border border-green-500/30 px-3 py-1.5 rounded-full flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> Live · 08:34
        </div>
        <div className="w-20 h-20 rounded-full bg-brand-indigo/20 border-2 border-brand-pale/50 flex items-center justify-center pulse-ring">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-indigo to-brand-light flex items-center justify-center">
            <span className="text-white font-bold text-lg">AI</span>
          </div>
        </div>
        <div className="flex items-end gap-1 h-8">
          {[5, 12, 18, 22, 28, 22, 18, 12, 16, 20, 26, 18, 10, 5].map((h, i) => (
            <div key={i} className="w-1.5 bg-brand-pale/60 rounded-full wave-bar" style={{ height: `${h}px` }} />
          ))}
        </div>
        <div className="text-sm text-white/60">Comms AI · Speaking</div>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex items-center gap-1.5 bg-white/10 text-white/70 text-xs px-2.5 py-1 rounded-full">
            <Phone size={10} /> or web
          </div>
          <span className="text-xs text-white/40">participant joins</span>
        </div>
      </div>
    </div>
  )
}

function AsyncPreview() {
  return (
    <div className="flex gap-3 h-full">
      <div className="w-48 bg-[#F7F7F9] rounded-xl border border-gray-100 p-4 flex flex-col shrink-0">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Agenda</div>
        {[
          { label: 'Introduction', done: true },
          { label: 'Background questions', current: true },
          { label: 'Document upload', done: false },
          { label: 'Final review', done: false },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-2.5 py-2.5">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
              item.done ? 'bg-green-100' : item.current ? 'bg-brand-ghost' : 'bg-gray-100'
            }`}>
              {item.done ? <Check size={9} weight="bold" className="text-green-600" /> : item.current ? <div className="w-2 h-2 rounded-full bg-brand-indigo" /> : <Circle size={9} className="text-gray-400" />}
            </div>
            <span className={`text-sm ${item.current ? 'text-brand-indigo font-semibold' : item.done ? 'text-gray-300 line-through' : 'text-gray-400'}`}>
              {item.label}
            </span>
          </div>
        ))}
        <div className="mt-auto bg-brand-ghost rounded-xl p-3 text-center">
          <div className="text-sm font-medium text-brand-indigo">Section 2 of 4</div>
          <div className="mt-1.5 h-1.5 bg-brand-secondary/40 rounded-full overflow-hidden">
            <div className="h-full bg-brand-indigo rounded-full w-1/4" />
          </div>
          <div className="mt-2 text-xs text-gray-500">Works on phone + desktop</div>
        </div>
      </div>
      <div className="flex-1 bg-white rounded-xl border border-gray-100 flex flex-col">
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="text-sm font-semibold text-gray-800">Contractor Onboarding</div>
          <div className="text-xs text-gray-400">Respond when ready</div>
        </div>
        <div className="flex-1 px-4 py-3 space-y-3 overflow-hidden">
          <div className="flex gap-2 items-start">
            <div className="w-6 h-6 rounded-lg bg-brand-indigo flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-[10px] text-white font-bold">AI</span>
            </div>
            <div className="bubble-agent text-sm">Hi! Can you confirm your full legal name as it appears on your ID?</div>
          </div>
          <div className="flex justify-end">
            <div className="bubble-user text-sm">Alex Torres</div>
          </div>
          <div className="flex gap-2 items-start">
            <div className="w-6 h-6 rounded-lg bg-brand-indigo flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-[10px] text-white font-bold">AI</span>
            </div>
            <div className="bubble-agent text-sm">Thanks, Alex. How many years of experience do you have in warehouse operations?</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SessionsPreview() {
  const [activeSession, setActiveSession] = useState(0)
  const sessions = [
    {
      title: 'Vendor Onboarding — Q4 2024', cat: 'Collect', pct: 100,
      meta: '18 participants · Async · Oct 12',
      findings: ['18/18 W-9 forms collected', '18/18 NDAs e-signed', '3 follow-ups auto-sent'],
      outcome: 'All 18 vendors cleared. Insurance renewals set.',
      color: 'bg-green-400',
    },
    {
      title: 'Engineering Screens — Jan 2025', cat: 'Test', pct: 58,
      meta: '12 candidates · Sync · Jan 8',
      findings: ['Alex Torres: 88/100 — Advance', 'Maria Chen: 84/100 — Advance', '4 candidates still pending'],
      outcome: 'Shortlist ready. Decline queue staged.',
      color: 'bg-brand-indigo',
    },
    {
      title: 'Q1 Compliance Training', cat: 'Review', pct: 60,
      meta: '40 employees · Async · Mar 1',
      findings: ['24/40 attested — on legal record', '4 failed comprehension check', '16 follow-ups queued'],
      outcome: null,
      color: 'bg-yellow-400',
    },
  ]
  const s = sessions[activeSession]
  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex gap-1.5">
        {sessions.map((ss, i) => (
          <button key={ss.title} onClick={() => setActiveSession(i)}
            className={`flex-1 text-left px-2.5 py-2 rounded-lg border transition-colors ${activeSession === i ? 'border-brand-indigo/30 bg-brand-ghost' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
            <div className={`w-full h-0.5 rounded-full ${ss.color} mb-1.5`} />
            <div className="text-[10px] font-semibold text-gray-600 truncate leading-snug">{ss.title.split(' — ')[0]}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">{ss.pct}% done</div>
          </button>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-3 flex-1 flex flex-col gap-2.5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-sm font-bold text-gray-900 leading-snug">{s.title}</div>
            <div className="text-xs text-gray-400 mt-0.5">{s.meta}</div>
          </div>
          <div className="text-sm font-bold text-brand-indigo shrink-0">{s.pct}%</div>
        </div>
        <div className="space-y-1">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Key findings</div>
          {s.findings.map(f => (
            <div key={f} className="flex items-start gap-1.5 text-xs text-gray-700">
              <div className="w-1 h-1 rounded-full bg-brand-indigo mt-1.5 shrink-0" /> {f}
            </div>
          ))}
        </div>
        {s.outcome && (
          <div className="bg-brand-ghost rounded-lg px-2.5 py-2 text-xs text-brand-shaft font-medium">
            <span className="text-brand-indigo font-bold">Outcome: </span>{s.outcome}
          </div>
        )}
      </div>
      <div className="bg-gray-50 rounded-xl px-3 py-2.5 text-xs text-gray-500">
        <span className="font-semibold text-gray-700">Use as context → </span>
        "Based on the Q4 vendor onboarding, collect updated COIs from the same 18 vendors..."
      </div>
    </div>
  )
}

/* ─── Comms Modes sub-tab info ─── */
const modeSubTabs = {
  sync: {
    icon: VideoCamera,
    title: 'Sync — Live Conversation',
    tag: 'Scheduled · Dedicated time',
    description: 'Sync asks for a dedicated time block from the participant. The agent schedules a mutual slot, sends a calendar invite, and conducts a structured agenda-driven conversation at that time — by phone or web. You know exactly when the outcome arrives: the moment the session ends.',
    note: 'Calendar invite and session link are sent by email. Comms can also dial participants directly by phone at the scheduled time.',
    outcomes: [
      { label: 'Full transcript with per-agenda-item summaries' },
      { label: 'Scores and decisions ready immediately when the call ends' },
      { label: 'Outcome ready immediately when the session ends' },
    ],
    href: '/app/sync',
    preview: <SyncPreview />,
  },
  async: {
    icon: ChatTeardropText,
    title: 'Async — Chat Link',
    tag: 'On their time · No commitment',
    description: 'Async sends an email with a secure session link — participants click it and respond at their own pace in a mobile-friendly browser app. No time commitment, no scheduling, no app download. Comms follows up automatically via email with configurable reminders until the session is complete.',
    note: 'Email is the primary delivery channel. SMS reminders are available after the recipient opts in via a one-time opt-in link.',
    outcomes: [
      { label: 'Structured response summary per person' },
      { label: 'Collected forms, files, or signed documents' },
      { label: 'Automated follow-up log + completion record' },
    ],
    href: '/app/async',
    preview: <AsyncPreview />,
  },
}

type ModeSubTab = keyof typeof modeSubTabs

/* ─── Main data ─── */
const SYNC_USES = ['Technical interviews', 'Role-play coaching', 'Product training walkthroughs', 'Discovery calls', 'Live compliance reviews']
const ASYNC_USES = ['Vendor onboarding', 'Document collection', 'Candidate pre-screening', 'Surveys & attestations', 'Policy sign-offs']

const MAIN_TABS = [
  {
    id: 'dispatcher' as const,
    number: '01',
    icon: ChatTeardropText,
    title: 'Comms Dispatcher',
  },
  {
    id: 'modes' as const,
    number: '02',
    icon: ArrowsLeftRight,
    title: 'Comms Modes',
  },
  {
    id: 'sessions' as const,
    number: '03',
    icon: Archive,
    title: 'Comms Sessions',
  },
]

type MainTab = typeof MAIN_TABS[number]['id']

/* ─── Left panel content per tab ─── */
function DispatcherLeft({ href }: { href: string }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-brand-ghost flex items-center justify-center">
          <ChatTeardropText size={22} className="text-brand-indigo" />
        </div>
        <div>
          <div className="text-xs font-semibold text-gray-400 tracking-widest uppercase">01</div>
          <div className="text-xl font-bold text-gray-900">Comms Dispatcher</div>
        </div>
      </div>
      <span className="pill pill-done text-xs self-start">Start here</span>
      <p className="text-gray-500 leading-relaxed text-[15px]">
        Describe any communication task in plain language. Configure the conversation and delivery; Comms generates a Comms draft — a structured agenda and question plan — for you to review. Accept to send, or edit and regenerate. Nothing goes out until you approve it.
      </p>
      <div className="bg-[#F7F8FC] rounded-2xl p-5 space-y-3">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">What you get</div>
        {[
          'Structured Comms draft (agenda + questions) before anything sends',
          'Accept or edit — full control before outreach begins',
          'A Comms Session is created the moment you accept',
        ].map((o, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
              <Check size={10} weight="bold" className="text-green-600" />
            </div>
            <span className="text-sm text-gray-700 leading-snug">{o}</span>
          </div>
        ))}
      </div>
      <div className="pt-4 border-t border-gray-100">
        <Link to={href} className="btn-primary w-full justify-center py-3.5 text-base">
          Open Comms Dispatcher <ArrowRight size={16} weight="bold" />
        </Link>
      </div>
    </div>
  )
}

function ModesLeft({ modeTab, setModeTab }: { modeTab: ModeSubTab; setModeTab: (t: ModeSubTab) => void }) {
  const sub = modeSubTabs[modeTab]
  const SubIcon = sub.icon
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-brand-ghost flex items-center justify-center">
          <ArrowsLeftRight size={22} className="text-brand-indigo" />
        </div>
        <div>
          <div className="text-xs font-semibold text-gray-400 tracking-widest uppercase">02</div>
          <div className="text-xl font-bold text-gray-900">Comms Modes</div>
        </div>
      </div>
      <span className="pill pill-active text-xs self-start">Auto-selected</span>
      <p className="text-gray-500 leading-relaxed text-[15px]">
        Comms automatically picks the right mode for your task. Some conversations need a live, dedicated time slot and real-time back-and-forth. Others work better at the participant's own pace.
      </p>

      {/* Use-case split */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Needs Sync', color: 'border-brand-indigo/30 bg-brand-ghost', textColor: 'text-brand-indigo', items: SYNC_USES },
          { label: 'Fits Async', color: 'border-green-200 bg-green-50', textColor: 'text-green-700', items: ASYNC_USES },
        ].map(col => (
          <div key={col.label} className={`rounded-xl border ${col.color} px-3 py-3`}>
            <div className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${col.textColor}`}>{col.label}</div>
            {col.items.map(item => (
              <div key={item} className="text-xs text-gray-600 py-0.5 flex items-center gap-1.5">
                <span className={`w-1 h-1 rounded-full ${col.label === 'Needs Sync' ? 'bg-brand-indigo' : 'bg-green-500'} shrink-0`} />
                {item}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Sub-tab buttons */}
      <div className="flex gap-2">
        {(['sync', 'async'] as ModeSubTab[]).map(t => {
          const Icon = modeSubTabs[t].icon
          return (
            <button key={t} onClick={() => setModeTab(t)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                modeTab === t
                  ? 'bg-brand-indigo text-white border-brand-indigo'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-brand-indigo/30 hover:text-brand-indigo'
              }`}>
              <Icon size={14} />
              {t === 'sync' ? 'Sync' : 'Async'}
            </button>
          )
        })}
      </div>

      {/* Selected sub-mode detail */}
      <div className="bg-[#F7F8FC] rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <SubIcon size={15} className="text-brand-indigo" />
          <span className="text-sm font-bold text-gray-900">{sub.title}</span>
          <span className="text-[10px] font-semibold text-gray-400 ml-auto">{sub.tag}</span>
        </div>
        <p className="text-sm text-gray-500 leading-relaxed">{sub.description}</p>
        {sub.note && (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
            <div className="w-4 h-4 rounded-full bg-amber-200 flex items-center justify-center shrink-0 mt-0.5 text-amber-700 font-bold text-[10px]">!</div>
            <p className="text-xs text-amber-800 leading-relaxed">{sub.note}</p>
          </div>
        )}
        <div className="space-y-2">
          {sub.outcomes.map((o, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                <Check size={9} weight="bold" className="text-green-600" />
              </div>
              <span className="text-xs text-gray-700 leading-snug">{o.label}</span>
            </div>
          ))}
        </div>
      </div>

      <Link to={sub.href} className="btn-primary w-full justify-center py-3 text-sm">
        Open {sub.title} prototype <ArrowRight size={14} weight="bold" />
      </Link>
    </div>
  )
}

function SessionsLeft({ href }: { href: string }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-brand-ghost flex items-center justify-center">
          <Archive size={22} className="text-brand-indigo" />
        </div>
        <div>
          <div className="text-xs font-semibold text-gray-400 tracking-widest uppercase">03</div>
          <div className="text-xl font-bold text-gray-900">Comms Sessions</div>
        </div>
      </div>
      <span className="pill pill-done text-xs self-start">Your record</span>
      <p className="text-gray-500 leading-relaxed text-[15px]">
        When you accept a Comms draft and hit send, a Comms Session is created. It tracks who received it, sends follow-ups automatically, and stores everything that comes back — answers, documents, decisions. When the work is done, the outcome is attached and stays on record.
      </p>
      <div className="flex items-start gap-2.5 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
        <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center shrink-0 mt-0.5 text-gray-500 font-bold text-[10px]">i</div>
        <p className="text-sm text-gray-600 leading-relaxed">Sessions are permanent. Pull one up anytime — use it as context for a new dispatch, chain it into a follow-on task, or just check what happened.</p>
      </div>
      <div className="bg-[#F7F8FC] rounded-2xl p-5 space-y-3">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">What you get</div>
        {[
          'Structured outcome: summary, findings, scores, and next actions',
          'Full follow-up log — who responded, who was chased, who didn\'t reply',
          'Reference it anytime — search, chain, or use as context in the Dispatcher',
        ].map((o, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
              <Check size={10} weight="bold" className="text-green-600" />
            </div>
            <span className="text-sm text-gray-700 leading-snug">{o}</span>
          </div>
        ))}
      </div>
      <div className="pt-4 border-t border-gray-100">
        <Link to={href} className="btn-primary w-full justify-center py-3.5 text-base">
          Open Comms Sessions <ArrowRight size={16} weight="bold" />
        </Link>
      </div>
    </div>
  )
}

/* ─── Main Section ─── */
export function ModesSection() {
  const [active, setActive] = useState<MainTab>('dispatcher')
  const [modeTab, setModeTab] = useState<ModeSubTab>('sync')

  const rightPreview = active === 'dispatcher'
    ? <DispatcherPreview />
    : active === 'sessions'
      ? <SessionsPreview />
      : modeSubTabs[modeTab].preview

  return (
    <section id="modes" className="py-24 bg-gray-50">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">

        {/* Header */}
        <div className="mb-12">
          <div className="tag bg-brand-ghost text-brand-indigo mb-4">How it works</div>
          <h2 className="text-5xl font-bold text-gray-900">
            Three concepts.<br />
            <span className="gradient-text">Everything else follows.</span>
          </h2>
          <p className="text-gray-500 mt-4 text-lg max-w-2xl">
            Use the <strong className="text-gray-700">Comms Dispatcher</strong> to describe what you need. Comms picks the right <strong className="text-gray-700">mode</strong> and generates a draft for your review. Accept it — and a <strong className="text-gray-700">Comms Session</strong> is created that runs everything from there.
          </p>
        </div>

        {/* 3 top-level tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {MAIN_TABS.map(m => {
            const Icon = m.icon
            return (
              <button
                key={m.id}
                onClick={() => setActive(m.id)}
                className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl font-semibold text-sm whitespace-nowrap transition-all border ${
                  active === m.id
                    ? 'bg-brand-indigo text-white border-brand-indigo shadow-lg shadow-brand-indigo/25'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-brand-indigo/40 hover:text-brand-indigo'
                }`}
              >
                <Icon size={15} />
                <span>{m.number}</span>
                <span>{m.title}</span>
              </button>
            )
          })}
        </div>

        {/* Showcase panel */}
        <div className="grid lg:grid-cols-[420px_1fr] gap-0 bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">

          {/* Left: info */}
          <div className="p-10 border-r border-gray-100 overflow-y-auto max-h-[680px]">
            {active === 'dispatcher' && <DispatcherLeft href="/app/dispatcher" />}
            {active === 'modes' && <ModesLeft modeTab={modeTab} setModeTab={setModeTab} />}
            {active === 'sessions' && <SessionsLeft href="/app/sessions" />}

            {/* Dot nav */}
            <div className="flex justify-center gap-2 pt-8">
              {MAIN_TABS.map(m => (
                <button
                  key={m.id}
                  onClick={() => setActive(m.id)}
                  className={`h-2 rounded-full transition-all ${active === m.id ? 'bg-brand-indigo w-6' : 'bg-gray-200 w-2 hover:bg-gray-300'}`}
                />
              ))}
            </div>
          </div>

          {/* Right: large preview */}
          <div className="bg-[#F7F8FC] p-8 min-h-[500px]">
            <div className="h-full">
              {rightPreview}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
