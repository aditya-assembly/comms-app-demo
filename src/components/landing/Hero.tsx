import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Sparkle, Microphone, Check, CaretRight } from '@phosphor-icons/react'
import { LogoVoiceWaveIcon } from '../Logo'
import {
  getHeroDemos,
  heroParticipantCount,
  heroAiSummary,
  type HeroSessionRow,
  type HeroDemoSlug,
} from '../../data/heroDemo'
import { buildAgendaBlocks, inferSessionTypeForUseCase } from '../../data/conversationAgenda'

type ChatMsg =
  | { role: 'user'; text: string }
  | { role: 'ai'; text: string }
  | { role: 'system'; text: string }
  | { role: 'review'; slug: HeroDemoSlug; ucTitle: string; blocks: ReturnType<typeof buildAgendaBlocks> }
  | { role: 'outcome'; slug: HeroDemoSlug; title: string; subtitle: string; nextAction: string }

function buildChatMessages(slug: HeroDemoSlug, uc: ReturnType<typeof getHeroDemos>[0]['useCase']): ChatMsg[] {
  const n = heroParticipantCount(uc)
  const agendaType = inferSessionTypeForUseCase(uc)
  const blocks = buildAgendaBlocks(agendaType, uc.title)
  const base: ChatMsg[] = [
    { role: 'user', text: uc.dispatchExample },
    { role: 'ai', text: heroAiSummary(uc) },
    { role: 'system', text: 'Conversation draft ready — review Comms (agenda + questions)' },
    { role: 'review', slug, ucTitle: uc.title, blocks },
    { role: 'system', text: 'Accepted — invites sending to participants' },
    { role: 'system', text: `Session live: ${uc.title} × ${n}` },
  ]

  if (slug === 'candidate-screening') {
    return [
      ...base,
      {
        role: 'outcome',
        slug,
        title: `Session complete — ${uc.title}`,
        subtitle: `${n} candidates ranked on your rubric.`,
        nextAction: 'Advance Torres & Chen — hold Park pending panel availability →',
      },
    ]
  }

  return [
    ...base,
    {
      role: 'outcome',
      slug,
      title: `Outcome ready — ${uc.title}`,
      subtitle: `${uc.exampleCompany} · structured fields you can pipe to tools, webhooks, or tickets.`,
      nextAction: 'Assign owners from the outcome object · or auto-route via webhook →',
    },
  ]
}

function sessionDotClass(s: HeroSessionRow['status']) {
  if (s === 'done') return 'bg-green-500'
  if (s === 'paused') return 'bg-amber-400'
  return 'bg-brand-indigo animate-pulse'
}

function statusLabel(s: HeroSessionRow['status']) {
  if (s === 'done') return 'Complete'
  if (s === 'paused') return 'Paused'
  return 'In progress'
}

export function Hero() {
  const demos = useMemo(() => getHeroDemos(), [])
  const [tabIndex, setTabIndex] = useState(0)
  const active = demos[tabIndex]
  const [selectedId, setSelectedId] = useState(() => active.sessions[0].id)

  const selected = useMemo(
    () => active.sessions.find(s => s.id === selectedId) ?? active.sessions[0],
    [active.sessions, selectedId]
  )

  const chatMessages = useMemo(
    () => buildChatMessages(active.slug, active.useCase),
    [active.slug, active.useCase]
  )

  const setTab = (i: number) => {
    setTabIndex(i)
    setSelectedId(demos[i].sessions[0].id)
  }

  return (
    <section className="pt-14 dot-grid overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        <div className="grid lg:grid-cols-[480px_1fr] gap-10 xl:gap-16 items-center min-h-[92vh] py-12">

          {/* Left */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 bg-brand-ghost text-brand-indigo px-4 py-2 rounded-full text-xs font-bold tracking-wide">
              <Sparkle size={13} weight="fill" />
              AGENTIC COMMUNICATION PLATFORM
            </div>

            <div>
              <h1 className="text-[4rem] xl:text-[4.75rem] leading-[1.0] font-bold text-brand-shaft tracking-tight">
                The best way<br />to{' '}
                <span className="gradient-text">work with</span><br />
                humans.
              </h1>
              <p className="mt-6 text-xl text-gray-500 leading-relaxed">
                Describe who you need to reach and why. You configure the conversation, review the Comms draft (agenda + questions), and accept before anything sends — then Comms runs each conversation and delivers a <strong className="text-brand-shaft font-semibold">structured outcome:</strong> ranked results, collected documents, decisions, and next steps. Not a chat log. An action.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link to="/app/dispatcher" className="btn-primary px-7 py-3.5 text-base">
                Open Work Dispatcher <ArrowRight size={16} weight="bold" />
              </Link>
              <a href="#modes" className="btn-secondary px-7 py-3.5 text-base">
                See What You Get
              </a>
            </div>

            <div className="flex items-center gap-8 pt-4 border-t border-gray-100">
              {[
                { v: 'Ranked Results', l: 'Scored, sorted, ready to act on' },
                { v: 'Collected Docs', l: 'Forms, files, signatures' },
                { v: 'Next Actions', l: 'Generated automatically' },
              ].map(s => (
                <div key={s.l}>
                  <div className="font-bold text-brand-indigo">{s.v}</div>
                  <div className="text-sm text-gray-400 mt-0.5">{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: app window mockup */}
          <div className="relative w-full">
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
              {/* Chrome bar */}
              <div className="flex items-center gap-2 px-5 py-4 bg-[#F7F7F9] border-b border-gray-100">
                <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                <div className="w-3 h-3 rounded-full bg-[#28C840]" />
                <div className="flex-1 mx-4 bg-white border border-gray-200 rounded-lg px-4 py-1.5 text-sm text-gray-400 shadow-sm flex items-center gap-2">
                  <LogoVoiceWaveIcon size={14} />
                  comms.ai/app
                </div>
              </div>

              <div className="flex h-[560px] min-h-[520px] max-h-[70vh] lg:max-h-none lg:h-[600px]">
                {/* Sidebar */}
                <div className="w-[210px] lg:w-[220px] bg-[#FAFAFA] border-r border-gray-100 flex flex-col shrink-0">
                  <div className="px-4 pt-4 pb-2 flex-1 min-h-0 overflow-y-auto">
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Sessions</div>
                    {active.sessions.map(s => {
                      const isSel = s.id === selected.id
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setSelectedId(s.id)}
                          className={`w-full text-left flex items-center gap-2.5 px-2.5 py-2 rounded-xl mb-1 transition-colors border ${
                            isSel
                              ? 'bg-white border-gray-200 shadow-sm'
                              : 'border-transparent hover:bg-white/80 hover:border-gray-100'
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full shrink-0 ${sessionDotClass(s.status)}`} />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-brand-shaft truncate">{s.label}</div>
                            <div className="text-[11px] text-gray-500 mt-0.5">{s.count}</div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                  <div className="p-3 border-t border-gray-100 shrink-0">
                    <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl bg-brand-ghost">
                      <div className="w-7 h-7 rounded-full bg-brand-indigo flex items-center justify-center">
                        <span className="text-xs text-white font-bold">J</span>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-brand-indigo">Jamie</div>
                        <div className="text-xs text-brand-light">Admin</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main column */}
                <div className="flex-1 flex flex-col bg-white min-w-0">
                  <div className="shrink-0 border-b border-gray-100 px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-brand-indigo flex items-center justify-center">
                        <Sparkle size={14} weight="fill" className="text-white" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-brand-shaft">Work Dispatcher</div>
                        <div className="text-xs text-gray-500 truncate">
                          Configure → review Comms → accept to send · sidebar is your session library.
                        </div>
                      </div>
                    </div>

                    {/* Session detail — updates when a sidebar row is selected */}
                    <div className="mt-3 rounded-xl border border-gray-100 bg-[#FAFBFC] px-3 py-2.5">
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Session detail</div>
                      <div className="text-sm font-bold text-brand-shaft leading-snug mt-0.5">{selected.label}</div>
                      <div className="text-xs text-gray-600 mt-1 leading-relaxed">{selected.detailLine}</div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white border border-gray-200 text-gray-700">
                          {selected.modeLabel}
                        </span>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white border border-gray-200 text-gray-700">
                          {selected.count}
                        </span>
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                            selected.status === 'done'
                              ? 'bg-green-50 text-green-800 border border-green-200'
                              : selected.status === 'paused'
                                ? 'bg-amber-50 text-amber-900 border border-amber-200'
                                : 'bg-brand-ghost text-brand-indigo border border-brand-indigo/20'
                          }`}
                        >
                          {statusLabel(selected.status)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 min-h-0 overflow-y-auto px-4 pt-3 space-y-3 pb-2">
                    {chatMessages.map((msg, i) => (
                      <div
                        key={`${active.slug}-${i}`}
                        className={`flex ${
                          msg.role === 'user'
                            ? 'justify-end'
                            : msg.role === 'system'
                              ? 'justify-center'
                              : msg.role === 'review'
                                ? 'justify-start'
                                : 'justify-start'
                        }`}
                      >
                        {msg.role === 'system' && (
                          <div className="text-xs font-semibold text-brand-indigo bg-brand-ghost px-3.5 py-1.5 rounded-full flex items-center gap-1.5 max-w-[95%] text-center">
                            <Check size={11} weight="bold" className="shrink-0" /> {msg.text}
                          </div>
                        )}
                        {msg.role === 'review' && (
                          <div className="w-full max-w-full border border-brand-indigo/20 rounded-2xl bg-white shadow-sm overflow-hidden">
                            <div className="px-3 py-2 border-b border-gray-100 bg-[#FAFBFC]">
                              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Review Comms</div>
                              <div className="text-xs font-bold text-brand-shaft mt-0.5">{msg.ucTitle}</div>
                              <div className="text-[10px] text-gray-500 mt-1 leading-snug">
                                Agenda & question plan · Accept in the Dispatcher before invites send.
                              </div>
                            </div>
                            <div className="px-3 py-2 space-y-2 max-h-40 overflow-y-auto">
                              {msg.blocks.map((b, j) => (
                                <div key={b.title} className="text-[11px]">
                                  <div className="font-bold text-brand-indigo">
                                    {j + 1}. {b.title}
                                  </div>
                                  <div className="text-gray-600 mt-0.5 leading-relaxed line-clamp-2">{b.summary}</div>
                                  <div className="text-gray-400 mt-0.5 truncate">Q: {b.questions[0]}</div>
                                </div>
                              ))}
                            </div>
                            <div className="flex gap-2 px-3 pb-2.5 pt-0.5">
                              <span className="flex-1 text-center text-[10px] font-semibold py-1.5 rounded-lg border border-gray-200 text-gray-500">
                                Edit
                              </span>
                              <span className="flex-1 text-center text-[10px] font-bold py-1.5 rounded-lg bg-brand-indigo text-white">
                                Accept
                              </span>
                            </div>
                          </div>
                        )}
                        {msg.role === 'user' && (
                          <div className="bubble-user text-sm max-w-[min(100%,20rem)] leading-relaxed">{msg.text}</div>
                        )}
                        {msg.role === 'ai' && (
                          <div className="flex items-start gap-2.5 max-w-[min(100%,22rem)]">
                            <div className="w-6 h-6 rounded-lg bg-brand-indigo flex items-center justify-center shrink-0 mt-0.5">
                              <Sparkle size={11} weight="fill" className="text-white" />
                            </div>
                            <div className="bubble-agent text-sm leading-relaxed">{msg.text}</div>
                          </div>
                        )}
                        {msg.role === 'outcome' && msg.slug === 'candidate-screening' && (
                          <div className="w-full max-w-full bg-white border border-gray-200 rounded-2xl shadow-md overflow-hidden">
                            <div className="bg-gradient-to-r from-brand-ghost/80 to-white px-3.5 py-2.5 border-b border-gray-100">
                              <div className="text-xs font-bold text-brand-shaft">{msg.title}</div>
                              <div className="text-[11px] text-gray-500 mt-0.5">{msg.subtitle}</div>
                            </div>
                            <div className="px-3 py-2 space-y-1.5">
                              {[
                                { rank: '1st', name: 'Alex Torres', score: '88', action: 'Advance', tone: 'text-green-700 bg-green-50' },
                                { rank: '2nd', name: 'Maria Chen', score: '84', action: 'Advance', tone: 'text-green-700 bg-green-50' },
                                { rank: '3rd', name: 'James Park', score: '71', action: 'Hold', tone: 'text-gray-600 bg-gray-50' },
                              ].map(row => (
                                <div key={row.name} className="flex items-center gap-2 text-xs">
                                  <div className={`font-bold px-1.5 py-0.5 rounded ${row.tone}`}>{row.rank}</div>
                                  <div className="flex-1 font-semibold text-brand-shaft truncate">{row.name}</div>
                                  <div className="font-bold text-brand-indigo tabular-nums">{row.score}</div>
                                  <div
                                    className={`font-medium shrink-0 ${
                                      row.action === 'Hold' ? 'text-gray-600' : 'text-green-700'
                                    }`}
                                  >
                                    {row.action}
                                  </div>
                                </div>
                              ))}
                            </div>
                            <button
                              type="button"
                              className="mx-3 mb-3 mt-0.5 w-[calc(100%-1.5rem)] text-left bg-brand-ghost rounded-xl px-3 py-2 flex items-center justify-between gap-2 border border-brand-indigo/10 hover:bg-brand-indigo/5 transition-colors"
                            >
                              <span className="text-xs font-semibold text-brand-indigo leading-snug">{msg.nextAction}</span>
                              <CaretRight size={12} weight="bold" className="text-brand-indigo shrink-0" />
                            </button>
                          </div>
                        )}
                        {msg.role === 'outcome' && msg.slug !== 'candidate-screening' && (
                          <div className="w-full max-w-full bg-white border border-gray-200 rounded-2xl shadow-md overflow-hidden">
                            <div className="bg-gradient-to-r from-brand-ghost/80 to-white px-3.5 py-2.5 border-b border-gray-100">
                              <div className="text-xs font-bold text-brand-shaft">{msg.title}</div>
                              <div className="text-[11px] text-gray-500 mt-0.5">{msg.subtitle}</div>
                            </div>
                            <div className="px-3 py-2 space-y-2">
                              {active.useCase.outcome.slice(0, 4).map((line, j) => (
                                <div key={j} className="flex items-start gap-2 text-xs text-gray-800">
                                  <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                                    <Check size={10} weight="bold" className="text-green-600" />
                                  </div>
                                  <span className="leading-relaxed">{line}</span>
                                </div>
                              ))}
                            </div>
                            <div className="mx-3 mb-3 px-3 py-2 rounded-xl bg-gray-50 border border-gray-100">
                              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Suggested next step</div>
                              <div className="text-xs font-semibold text-brand-indigo mt-1 leading-snug">{msg.nextAction}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Composer */}
                  <div className="shrink-0 px-3 py-3 border-t border-gray-100">
                    <div className="flex items-center gap-3 bg-[#F4F4F6] rounded-2xl px-3 py-2.5">
                      <Microphone size={16} weight="light" className="text-gray-400 shrink-0" />
                      <span className="text-sm text-gray-400 flex-1 truncate">What do you need to communicate next…</span>
                      <div className="w-8 h-8 rounded-xl bg-brand-indigo flex items-center justify-center shrink-0">
                        <ArrowRight size={14} weight="bold" className="text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Scenario tabs */}
                  <div className="shrink-0 border-t border-gray-200 bg-[#F7F7F9] px-2 py-2">
                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-2 mb-1.5">
                      Try a scenario
                    </div>
                    <div className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-thin">
                      {demos.map((d, i) => (
                        <button
                          key={d.slug}
                          type="button"
                          onClick={() => setTab(i)}
                          className={`shrink-0 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap ${
                            i === tabIndex
                              ? 'bg-white text-brand-indigo border-brand-indigo/30 shadow-sm'
                              : 'bg-white/60 text-gray-600 border-transparent hover:border-gray-200 hover:bg-white'
                          }`}
                        >
                          {d.tabLabel}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
