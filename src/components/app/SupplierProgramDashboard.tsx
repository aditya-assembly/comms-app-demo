import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Workflow, Clock, Users, FileText, Download, Filter, ShieldAlert, Link2 } from 'lucide-react'

const PIPELINE = [
  { stage: 'Invited', count: 12, color: '#94a3b8' },
  { stage: 'In progress', count: 28, color: '#6366f1' },
  { stage: 'Pending SPE review', count: 9, color: '#f59e0b' },
  { stage: 'Approved', count: 41, color: '#22c55e' },
  { stage: 'Needs info', count: 6, color: '#ef4444' },
  { stage: 'Rejected', count: 2, color: '#64748b' },
]

const TAT_BY_STAGE = [
  { stage: 'Invited → In progress', days: 1.1 },
  { stage: 'In progress → Pending review', days: 2.4 },
  { stage: 'Pending review → Approved', days: 1.8 },
]

const SPE_QUEUE = [
  { supplier: 'Summit Field Services', days: 5, gap: 'MSA e-sign' },
  { supplier: 'Apex Industrial Partners', days: 4, gap: 'COI minimums' },
  { supplier: 'Harbor Ridge Contractors', days: 3, gap: 'CA addendum' },
]

export function SupplierProgramDashboard() {
  const [program, setProgram] = useState('general')
  const [stageFilter, setStageFilter] = useState('all')
  const [gapFilter, setGapFilter] = useState('any')
  const chartData = useMemo(
    () => TAT_BY_STAGE.map((r) => ({ name: r.stage, days: r.days })),
    [],
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#F8FAFC]">
      <div className="px-5 py-4 border-b border-[#E2E8F0] bg-white shrink-0">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">AgileOne Supplier Onboarding — Q2 2026</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Pipeline health, turnaround time, and SPE review queue (demo data)
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="text-xs font-semibold px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-gray-600 hover:bg-gray-50 flex items-center gap-1.5"
            >
              <Download className="h-3.5 w-3.5" /> Export status report
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Filters (demo UI — client / stage / document gap) */}
        <section className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-brand-indigo" />
            <h3 className="text-sm font-bold text-gray-900">Filters</h3>
            <span className="text-[10px] font-medium text-gray-400">(demo controls)</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={program}
              onChange={(e) => setProgram(e.target.value)}
              className="text-xs rounded-lg border border-[#E2E8F0] px-3 py-2 bg-white text-gray-700"
            >
              <option value="general">Program: General Staffing</option>
              <option value="healthcare">Program: Healthcare</option>
            </select>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="text-xs rounded-lg border border-[#E2E8F0] px-3 py-2 bg-white text-gray-700"
            >
              <option value="all">Stage: All</option>
              <option value="invited">Invited</option>
              <option value="in_progress">In progress</option>
              <option value="pending_spe">Pending SPE review</option>
              <option value="approved">Approved</option>
              <option value="needs_info">Needs info</option>
            </select>
            <select
              value={gapFilter}
              onChange={(e) => setGapFilter(e.target.value)}
              className="text-xs rounded-lg border border-[#E2E8F0] px-3 py-2 bg-white text-gray-700"
            >
              <option value="any">Document gap: Any</option>
              <option value="coi">COI / insurance</option>
              <option value="msa">MSA e-sign</option>
              <option value="addenda">State addenda</option>
              <option value="banking">Banking / ACH</option>
            </select>
            <span className="text-xs text-gray-400 self-center">Client filter ties to program assignment in live data.</span>
          </div>
        </section>

        {/* Session type & collection checklist (use case §2) */}
        <section className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Link2 className="h-4 w-4 text-brand-indigo" />
            <h3 className="text-sm font-bold text-gray-900">Comms setup (preview)</h3>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            Session type: <span className="font-semibold text-gray-700">Supplier onboarding</span> · Channel:{' '}
            <span className="font-semibold text-gray-700">email + resumable web link</span>
          </p>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border border-[#F1F5F9] bg-[#F8FAFC] p-3">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Items to collect</div>
              <ul className="text-gray-700 space-y-1 list-disc pl-4 text-xs leading-relaxed">
                <li>COI — limits, named insured, expiry vs program minimums</li>
                <li>W-9 — OCR: EIN, legal name, address vs profile</li>
                <li>Signed MSA — e-sign track (DocuSign)</li>
                <li>Banking / ACH setup</li>
                <li>Capability profile (industries, geo, specialties)</li>
                <li>Client addenda (conditional by program / state)</li>
              </ul>
            </div>
            <div className="rounded-xl border border-[#F1F5F9] bg-[#F8FAFC] p-3">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Reminders & escalation</div>
              <ul className="text-gray-700 space-y-1 list-disc pl-4 text-xs leading-relaxed">
                <li>Reminders: Day 3, Day 7</li>
                <li>After 2nd attempt with no response → notify owning SPE with context</li>
                <li>SPE review: tokenized link — approve / request info / reject</li>
                <li>Post-approval: SharePoint filing; Venda setup request (demo narrative)</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Pipeline */}
        <section className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Workflow className="h-4 w-4 text-brand-indigo" />
            <h3 className="text-sm font-bold text-gray-900">Pipeline</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {PIPELINE.map((p) => (
              <div
                key={p.stage}
                className="rounded-xl border border-[#F1F5F9] bg-[#F8FAFC] px-3 py-3 text-center"
              >
                <div className="text-2xl font-black tabular-nums" style={{ color: p.color }}>
                  {p.count}
                </div>
                <div className="text-[10px] font-semibold text-gray-500 mt-1 leading-tight">{p.stage}</div>
              </div>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <section className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-4 w-4 text-brand-indigo" />
              <h3 className="text-sm font-bold text-gray-900">Average days between stages</h3>
            </div>
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 10 }} unit=" d" />
                  <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 9 }} />
                  <Tooltip
                    formatter={(v: number) => [`${v.toFixed(1)} days`, 'Avg TAT']}
                    contentStyle={{ fontSize: 12 }}
                  />
                  <Bar dataKey="days" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[11px] text-gray-400 mt-2">
              Bottleneck spotlight: transition into <span className="font-semibold text-gray-600">Pending SPE review</span>{' '}
              when MSA or addenda are outstanding.
            </p>
          </section>

          <section className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-4 w-4 text-brand-indigo" />
              <h3 className="text-sm font-bold text-gray-900">SPE review queue</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-[#F1F5F9]">
                  <th className="pb-2">Supplier</th>
                  <th className="pb-2">Days waiting</th>
                  <th className="pb-2">Document gap</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {SPE_QUEUE.map((row) => (
                  <tr key={row.supplier}>
                    <td className="py-2.5 font-medium text-gray-900">{row.supplier}</td>
                    <td className="py-2.5 text-amber-700 font-semibold">{row.days}d</td>
                    <td className="py-2.5 text-gray-500 text-xs">{row.gap}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>

        <section className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert className="h-4 w-4 text-amber-600" />
            <h3 className="text-sm font-bold text-gray-900">Exception handling (illustrative)</h3>
          </div>
          <div className="grid sm:grid-cols-2 gap-3 text-xs text-gray-600 leading-relaxed">
            <div className="rounded-xl border border-amber-100 bg-amber-50/80 p-3">
              <span className="font-semibold text-amber-900">COI below minimums</span>
              <p className="mt-1">
                Session returns specific feedback to the supplier (e.g. $500K vs $1M required) — SPE not looped in until a
                corrected COI is uploaded.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <span className="font-semibold text-slate-900">Exceptions / variance</span>
              <p className="mt-1">
                Cannot meet a standard requirement? Route to an <strong>exceptions amendment</strong> path without
                red-lining the original MSA.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-4 w-4 text-brand-indigo" />
            <h3 className="text-sm font-bold text-gray-900">Insight prompts (Agent)</h3>
          </div>
          <ul className="text-sm text-gray-600 space-y-2 list-disc pl-5">
            <li>Which suppliers have a COI expiring in the next 30 days?</li>
            <li>How many suppliers are stuck at the MSA e-sign step?</li>
            <li>Compare average time to approval: Healthcare vs General Staffing</li>
            <li>Show suppliers missing California state addenda</li>
          </ul>
          <p className="text-[11px] text-gray-400 mt-3">
            People view: each supplier record ties documents, session history, and a compliance calendar (e.g. COI renewals
            at 60 days) — explore <span className="font-medium text-gray-600">People</span> in the sidebar with demo
            participants (reference = <code className="text-[10px] bg-gray-100 px-1 rounded">supplier_onboarding_id</code>
            ).
          </p>
        </section>

        <section className="rounded-2xl border border-dashed border-[#E2E8F0] bg-white/80 p-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Expected outcomes (use case)</h3>
          <ul className="text-xs text-gray-600 grid sm:grid-cols-2 gap-x-6 gap-y-1 list-disc pl-4">
            <li>Onboarding time: 2–3 weeks → 3–5 days (guided session)</li>
            <li>SPE touches exceptions, not routine collection</li>
            <li>Validated docs before SPE review; audit trail per supplier</li>
            <li>SharePoint filing by program; Venda trigger on approval</li>
          </ul>
        </section>
      </div>
    </div>
  )
}
