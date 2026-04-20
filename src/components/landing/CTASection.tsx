import { Link } from 'react-router-dom'
import { ArrowRight } from '@phosphor-icons/react'

export function CTASection() {
  return (
    <section className="py-20 bg-white">
      <div className="section-container">
        <div className="relative overflow-hidden bg-gradient-to-br from-brand-navy via-brand-indigo to-brand-light rounded-3xl px-8 py-16 text-center text-white">
          <div className="absolute inset-0 dot-grid opacity-20" />
          <div className="relative space-y-6">
            <h2 className="text-4xl font-bold">Ready to work with humans at scale?</h2>
            <p className="text-white/70 max-w-lg mx-auto">
              Start with the dispatcher. Describe what you need, configure the conversation, review the generated Comms, then accept — only then does Comms reach out.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/app/dispatcher" className="bg-white text-brand-indigo hover:bg-brand-ghost px-7 py-3.5 rounded-xl font-bold text-sm transition-colors inline-flex items-center gap-2 shadow-lg">
                Open Work Dispatcher <ArrowRight size={15} weight="bold" />
              </Link>
              <a href="#modes"
                className="bg-white/10 border border-white/20 text-white hover:bg-white/20 px-7 py-3.5 rounded-xl font-bold text-sm transition-colors inline-flex items-center gap-2">
                Explore All Modes
              </a>
            </div>
            <p className="text-white/30 text-xs">No card required · Enterprise plans available</p>
          </div>
        </div>
      </div>
    </section>
  )
}
