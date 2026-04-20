import { Nav } from '../components/Nav'
import { Hero } from '../components/landing/Hero'
import { ModesSection } from '../components/landing/ModesSection'
import { SessionsSection } from '../components/landing/SessionsSection'
import { DeveloperTeaser } from '../components/landing/DeveloperTeaser'
import { CTASection } from '../components/landing/CTASection'
import { Footer } from '../components/Footer'

export function LandingPage() {
  return (
    <div className="min-h-screen">
      <Nav />
      <main className="pt-14">
        <Hero />
        <ModesSection />
        <SessionsSection />
        <DeveloperTeaser />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}
