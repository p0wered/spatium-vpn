import { useSmoothScroll } from '../../lib/smoothScroll'
import { Bypass } from '../landing/Bypass'
import { Header } from '../landing/Header'
import { Hero } from '../landing/Hero'
import { Privacy } from '../landing/Privacy'

/** Текущий лендинг с альтернативным Hero-фоном Color Bends. */
export function DevPage() {
  useSmoothScroll()

  return (
    <div className="select-none">
      <Header />
      <main>
        <Hero background="color-bends" contentLayout="left" />
        <Bypass />
        <Privacy />
      </main>
    </div>
  )
}
