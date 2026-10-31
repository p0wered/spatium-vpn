import { Bypass } from './Bypass'
import { Footer } from './footer/Footer'
import { Header } from './Header'
import { Hero } from './Hero'
import { Pricing } from './Pricing'
import { Privacy } from './Privacy'
import { Testimonials } from './Testimonials'
import { useSmoothScroll } from '../../lib/smoothScroll'

export function LandingPage() {
  // Инерция скролла — только на лендинге: в dashboard скролл утилитарный
  useSmoothScroll()

  return (
    <div className="select-none">
      <Header />
      <main>
        <Hero />
        <Bypass />
        <Privacy />
        <Testimonials />
        <Pricing />
      </main>
      <Footer />

    </div>
  )
}
