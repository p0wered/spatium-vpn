import { lazy, Suspense, useRef } from 'react'
import { motion, useInView, useReducedMotion } from 'motion/react'
import { useLocation } from 'react-router'
import { Wordmark } from '../../../components/Wordmark'
import { scrollToTop } from '../../../lib/scroll'
import { FooterLink } from './FooterLink'
import { footerGroups, SUPPORT_EMAIL, SUPPORT_TELEGRAM } from './links'

const HorizonLight = lazy(() => import('../../../components/backgrounds/HorizonLight'))

const label = 'font-mono text-[11px] tracking-[0.14em] text-white/40 uppercase'
const ease = [0.23, 1, 0.32, 1] as const

/** Высота канваса над линией горизонта, CSS px */
const LIGHT_HEIGHT = 420

/**
 * Футер «Горизонт»: ссылки и статус сверху, внизу — вордмарк, восходящий
 * из-за линии горизонта. Свет у линии подсвечивает нижнюю часть букв —
 * тот же «рассвет», что у Testimonials, только прямой.
 */
export function Footer() {
  const { pathname } = useLocation()
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.15 })
  const reduced = useReducedMotion()
  const show = Boolean(reduced || inView)
  // Свет и вордмарк стартуют, когда до горизонта действительно доскроллили,
  // а не по верхушке футера — иначе вступление доигрывает за кадром
  const horizonRef = useRef<HTMLDivElement>(null)
  const horizonInView = useInView(horizonRef, { once: true, amount: 0.5 })
  const lit = Boolean(reduced || horizonInView)

  const fade = (delay: number) => ({
    initial: reduced ? false : { opacity: 0 },
    animate: { opacity: show ? 1 : 0 },
    transition: { duration: 0.8, delay: show ? delay : 0, ease },
  })

  return (
    <footer ref={ref} className="relative overflow-hidden bg-black pt-16 sm:pt-24">
      <div className="landing-container grid gap-14 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-20">
        <motion.div {...fade(0)} className="flex flex-col gap-5">
          <Wordmark
            onClick={(e) => {
              // Мы уже на лендинге — Link на тот же роут ничего не делает,
              // поэтому вместо него плавно возвращаемся к началу страницы.
              // На страницах документов отрабатывает обычный переход на «/»
              if (pathname !== '/') return
              e.preventDefault()
              scrollToTop()
            }}
          />
          <p className="max-w-[300px] text-sm leading-6 font-light text-white/50">
            Fast, private VPN that just works — on any network.
          </p>
          <div className="mt-2 flex flex-col gap-2 font-mono text-xs text-white/50">
            <a
              href={SUPPORT_TELEGRAM.href}
              target="_blank"
              rel="noreferrer"
              className="w-fit transition-colors hover:text-fg"
            >
              {SUPPORT_TELEGRAM.handle}
            </a>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="w-fit transition-colors select-text hover:text-fg"
            >
              {SUPPORT_EMAIL}
            </a>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 gap-x-10 gap-y-10 sm:grid-cols-4 lg:gap-x-16">
          {footerGroups.map((group, i) => (
            <motion.nav key={group.title} {...fade(0.08 * (i + 1))} aria-label={group.title}>
              <p className={label}>{group.title}</p>
              <ul className="mt-5 space-y-3">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <FooterLink link={link} className="text-sm text-white/65 hover:text-fg" />
                  </li>
                ))}
              </ul>
            </motion.nav>
          ))}
        </div>
      </div>

      <div ref={horizonRef} className="relative mt-20 sm:mt-28" aria-hidden>
        {/* Канвас кончается ровно на линии горизонта: свет обрезан снизу,
            как солнце, которое ещё не взошло */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0"
          style={{ height: LIGHT_HEIGHT }}
        >
          <Suspense fallback={null}>
            <HorizonLight active={lit} lineOffset={0} />
          </Suspense>
        </div>

        <div className="landing-container relative">
          <div className="footer-horizon-clip">
            <motion.p
              className="footer-horizon-word"
              initial={reduced ? false : { opacity: 0, y: '28%' }}
              animate={lit ? { opacity: 1, y: '0%' } : { opacity: 0, y: '28%' }}
              transition={{ duration: 1.8, delay: lit ? 0.45 : 0, ease }}
            >
              Spatium
            </motion.p>
          </div>
        </div>
      </div>
    </footer>
  )
}
