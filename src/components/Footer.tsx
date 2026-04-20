export function Footer() {
  return (
    <footer className="bg-[#0D1117] text-white">
      <div className="section-container py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-10">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-brand-indigo flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                  <path d="M2 4h10M2 7h7M2 10h4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <span className="font-bold text-base">Comms</span>
            </div>
            <p className="text-xs text-white/40">The best way to work with humans.</p>
          </div>
          {[
            { label: 'Product', links: ['Dispatcher', 'Modes', 'Sessions', 'Outcomes'] },
            { label: 'Use Cases', links: ['Collect', 'Review', 'Test', 'Train', 'Recruit'] },
            { label: 'Company', links: ['About', 'Security', 'Pricing', 'Contact'] },
          ].map(col => (
            <div key={col.label}>
              <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3">{col.label}</div>
              <ul className="space-y-2">
                {col.links.map(l => (
                  <li key={l}><a href="#" className="text-sm text-white/40 hover:text-white transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-white/25">
          <span>© 2026 Assembly Industries. All rights reserved.</span>
          <div className="flex gap-5">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Security</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
