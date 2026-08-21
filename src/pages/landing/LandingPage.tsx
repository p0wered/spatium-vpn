import { Bypass } from './Bypass'
import { Header } from './Header'
import { Hero } from './Hero'
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
      </main>
    </div>
  )
}
