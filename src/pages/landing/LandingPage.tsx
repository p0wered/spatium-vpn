import { Bypass } from './Bypass'
import { Header } from './Header'
import { Hero } from './Hero'
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
      </main>
    </div>
  )
}
