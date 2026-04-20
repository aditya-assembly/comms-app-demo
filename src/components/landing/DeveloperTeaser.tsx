import { Link } from 'react-router-dom'
import { ArrowRight, Terminal, Globe, Plug, Check } from '@phosphor-icons/react'

const SNIPPET = `const session = await comms.sessions.dispatch({
  task: "Screen 5 backend engineers and rank them.",
  participants: engineeringCandidates,
  mode: "async",
  on_complete: {
    callback_url: "https://yourapp.com/hook"
  }
})
// session.id → "sess_01HXYZ"
// Comms handles every conversation from here.
// You receive a structured outcome when done.`

export function DeveloperTeaser() {
  return (
    <section className="py-24 bg-[#0A0E1A] text-white overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        <div className="grid lg:grid-cols-[1fr_1fr] gap-12 lg:gap-20 items-center">

          {/* Left: copy */}
          <div className="space-y-7">
            <div>
              <div className="inline-flex items-center gap-2 bg-brand-indigo/20 border border-brand-indigo/30 text-brand-pale px-3.5 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-5">
                <Terminal size={11} weight="bold" /> For developers &amp; agents
              </div>
              <h2 className="text-4xl xl:text-5xl font-bold leading-tight tracking-tight">
                Claude can dispatch.<br />
                <span className="text-brand-pale">Copilot can collect.</span><br />
                Any agent can work<br />with humans via Comms.
              </h2>
            </div>

            <p className="text-white/50 text-lg leading-relaxed max-w-lg">
              Comms is API-first, MCP-native, and CLI-ready. Dispatch sessions from your agents, receive structured JSON outcomes via webhook. The human layer — handled.
            </p>

            <div className="space-y-3">
              {[
                { icon: Globe,    label: 'REST API + TypeScript SDK', desc: 'Dispatch sessions and receive outcomes as structured objects' },
                { icon: Plug,     label: 'Native MCP server',         desc: 'Claude, Cursor, and Copilot call Comms tools directly' },
                { icon: Terminal, label: 'CLI for scripts + CI/CD',   desc: 'Chain sessions into pipelines with stdout JSON output' },
              ].map(item => {
                const Icon = item.icon
                return (
                  <div key={item.label} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-brand-indigo/15 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon size={14} weight="duotone" className="text-brand-pale" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{item.label}</div>
                      <div className="text-sm text-white/40 mt-0.5">{item.desc}</div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link to="/developer" className="btn-primary py-3 px-6">
                View developer docs <ArrowRight size={15} weight="bold" />
              </Link>
              <a href="https://docs.comms.ai"
                className="bg-white/10 border border-white/20 text-white hover:bg-white/15 px-6 py-3 rounded-xl font-semibold text-sm transition-colors inline-flex items-center gap-2">
                API reference
              </a>
            </div>
          </div>

          {/* Right: code window */}
          <div className="space-y-4">
            {/* Code block */}
            <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
              <div className="flex items-center justify-between bg-[#161B22] px-5 py-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                    <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                    <div className="w-3 h-3 rounded-full bg-[#28C840]" />
                  </div>
                  <span className="text-xs font-semibold text-white/35">dispatch.ts</span>
                </div>
                <span className="text-xs font-mono text-white/20 uppercase tracking-widest">typescript</span>
              </div>
              <div className="bg-[#0D1117] px-5 py-5 overflow-x-auto">
                <pre className="text-sm leading-relaxed font-mono" style={{ color: '#C9D1D9' }}>
                  {SNIPPET.split('\n').map((line, i) => (
                    <div key={i} className="flex gap-4">
                      <span className="select-none text-right w-4 shrink-0 text-xs leading-6" style={{ color: 'rgba(255,255,255,0.2)' }}>{i + 1}</span>
                      <span dangerouslySetInnerHTML={{ __html: highlightLine(line) }} />
                    </div>
                  ))}
                </pre>
              </div>
            </div>

            {/* Outcome card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Check size={10} weight="bold" className="text-green-400" />
                </div>
                <span className="text-xs font-bold text-green-400">Outcome received · webhook fired</span>
              </div>
              <div className="font-mono text-sm text-white/60 space-y-1">
                <div><span className="text-white/25">session.status</span> → <span className="text-green-400">"complete"</span></div>
                <div><span className="text-white/25">session.outcome.findings</span> → <span className="text-blue-300">[5 ranked results]</span></div>
                <div><span className="text-white/25">session.outcome.generated_action</span> → <span className="text-purple-300">"Draft invites for..."</span></div>
              </div>
            </div>

            {/* Works with */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs text-white/25 font-semibold uppercase tracking-wider">Works with</span>
              {['Claude', 'Cursor', 'Copilot', 'GPT-4o', 'Any MCP agent'].map(name => (
                <span key={name} className="text-xs font-medium text-white/40 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function highlightLine(line: string): string {
  const esc = line
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Split into safe zones (strings/comments) and plain zones
  const re = /(\/\/.*$|"[^"]*"|'[^']*'|`[^`\n]*`)/g
  const parts: Array<{ safe: boolean; text: string }> = []
  let last = 0, m: RegExpExecArray | null
  while ((m = re.exec(esc)) !== null) {
    if (m.index > last) parts.push({ safe: false, text: esc.slice(last, m.index) })
    parts.push({ safe: true, text: m[0] })
    last = m.index + m[0].length
  }
  if (last < esc.length) parts.push({ safe: false, text: esc.slice(last) })

  return parts.map(p => {
    if (p.safe) {
      const color = p.text.startsWith('//') ? '#8B949E' : '#A5D6FF'
      return `<span style='color:${color}'>${p.text}</span>`
    }
    return p.text
      .replace(/\b(const|let|await|async|return|new|import|from)\b/g,
        `<span style='color:#FF7B72'>$1</span>`)
      .replace(/\b(comms|session|sessions|outcome)\b/g,
        `<span style='color:#FFA7C4'>$1</span>`)
      .replace(/\.(dispatch|create|sessions|outcome|on|waitForCompletion)\b/g,
        `<span style='color:#D2A8FF'>.$1</span>`)
      .replace(/\b(process|console)\b/g,
        `<span style='color:#79C0FF'>$1</span>`)
  }).join('')
}
