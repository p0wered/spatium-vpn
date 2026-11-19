import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { plans, type Plan } from './plans'
import { motion, useInView, useReducedMotion, type Variants } from 'motion/react'
import { ArrowUpRight, Check } from 'lucide-react'
import { Button } from '../../components/Button'
import { GlassCard } from '../../components/GlassCard'

const revealContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.06 } },
}

const textItem: Variants = {
  hidden: { opacity: 0, y: 28, filter: 'blur(6px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
  },
}

/** Featured plan leads; the sides follow it. */
function cardDelay(name: Plan['name']) {
  if (name === 'Sidus') return 0.12
  if (name === 'Orbis') return 0.22
  return 0.3
}

function DashMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
      <rect x="3" y="7.35" width="10" height="1.3" rx="0.65" fill="currentColor" />
    </svg>
  )
}

function PlanCard({
  plan,
  visible,
  reduced,
}: {
  plan: Plan
  visible: boolean
  reduced: boolean | null
}) {
  return (
    <motion.article
      // < lg — слайд карусели: ширина экрана минус подглядывающие соседи,
      // snap-always — один свайп листает ровно одну карточку
      className="w-[min(20rem,calc(100vw-4.5rem))] shrink-0 snap-center snap-always lg:h-full lg:w-auto"
      aria-labelledby={`plan-${plan.name.toLowerCase()}`}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 28, filter: 'blur(8px)' }}
      animate={
        visible
          ? { opacity: 1, y: 0, filter: 'blur(0px)' }
          : reduced
            ? { opacity: 0 }
            : { opacity: 0, y: 28, filter: 'blur(8px)' }
      }
      transition={{
        duration: reduced ? 0.4 : 0.85,
        delay: visible ? cardDelay(plan.name) : 0,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <GlassCard className="pricing-card flex h-full flex-col">
        <div className="pricing-card-body">
          <h3 id={`plan-${plan.name.toLowerCase()}`} className="pricing-card-name">
            {plan.name}
          </h3>
          <p className="pricing-card-tagline">{plan.tagline}</p>

          <p className="pricing-card-price">
            <span>{plan.price}</span>
            <span>/day</span>
          </p>

          <ul className="pricing-card-features">
            {plan.features.map((feature) => (
              <li key={feature.label} className={feature.included ? 'is-included' : 'is-excluded'}>
                {feature.included ? (
                  <Check size={16} strokeWidth={1.75} aria-hidden />
                ) : (
                  <DashMark />
                )}
                <span>
                  {feature.label}
                  {!feature.included && <span className="sr-only"> (not included)</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <Button
          type="button"
          size="lg"
          variant={plan.featured ? 'primary' : 'secondary'}
          className="pricing-card-cta"
        >
          Get {plan.name}
        </Button>
      </GlassCard>
    </motion.article>
  )
}

/**
 * До lg тарифы — горизонтальная карусель на нативном scroll-snap: стопка из
 * трёх высоких карточек растягивала секцию на два с лишним экрана, а сравнивать
 * тарифы приходилось по памяти. Возвращает ref ленты, индекс карточки у центра
 * и переход к карточке по индексу.
 */
function usePlanCarousel(reduced: boolean | null) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef(0)
  const featuredIndex = Math.max(
    plans.findIndex((plan) => plan.featured),
    0,
  )
  const [active, setActive] = useState(featuredIndex)

  /** scrollLeft, при котором карточка index стоит по центру ленты */
  const offsetFor = (scroller: HTMLElement, index: number) => {
    const card = scroller.children[index] as HTMLElement | undefined
    if (!card) return 0
    return card.offsetLeft - (scroller.clientWidth - card.offsetWidth) / 2
  }

  // Лента открывается на рекомендованном тарифе: соседи подглядывают с обеих
  // сторон и сразу показывают, что карточки листаются. До отрисовки — иначе
  // был бы виден прыжок от первой карточки.
  useLayoutEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller || scroller.scrollWidth <= scroller.clientWidth) return
    scroller.scrollLeft = offsetFor(scroller, featuredIndex)
  }, [featuredIndex])

  useLayoutEffect(() => () => cancelAnimationFrame(frameRef.current), [])

  const onScroll = useCallback(() => {
    cancelAnimationFrame(frameRef.current)
    frameRef.current = requestAnimationFrame(() => {
      const scroller = scrollerRef.current
      if (!scroller) return
      const center = scroller.scrollLeft + scroller.clientWidth / 2
      let nearest = 0
      let best = Infinity
      Array.from(scroller.children).forEach((child, index) => {
        const card = child as HTMLElement
        const distance = Math.abs(card.offsetLeft + card.offsetWidth / 2 - center)
        if (distance < best) {
          best = distance
          nearest = index
        }
      })
      setActive(nearest)
    })
  }, [])

  const goTo = useCallback(
    (index: number) => {
      const scroller = scrollerRef.current
      if (!scroller) return
      scroller.scrollTo({
        left: offsetFor(scroller, index),
        behavior: reduced ? 'auto' : 'smooth',
      })
    },
    [reduced],
  )

  return { scrollerRef, active, onScroll, goTo }
}

/**
 * Closing conversion on the landing. Composition follows the approved
 * three-plan board; material stays in the page's glass language.
 */
export function Pricing() {
  const sectionRef = useRef<HTMLElement>(null)
  const inView = useInView(sectionRef, { once: true, amount: 0.18 })
  const reduced = useReducedMotion()
  const carousel = usePlanCarousel(reduced)

  return (
    <section
      id="pricing"
      ref={sectionRef}
      aria-labelledby="pricing-title"
      className="relative overflow-hidden scroll-mt-24 py-24 sm:py-28 lg:py-[132px]"
    >
      <motion.div
        className="landing-container"
        variants={revealContainer}
        initial={reduced ? false : 'hidden'}
        animate={reduced || inView ? 'show' : 'hidden'}
      >
        <motion.h2
          id="pricing-title"
          variants={textItem}
          className="mx-auto max-w-[720px] bg-clip-text text-center
          bg-[linear-gradient(180deg,#fff_8%,rgb(255_255_255/0.72)_100%)]
          text-4xl leading-[1.06] font-semibold tracking-[-0.03em]
          text-transparent text-balance sm:text-5xl lg:text-[64px]
          lg:leading-[68px]"
        >
          Your pace, your plan
        </motion.h2>

        <motion.p
          variants={textItem}
          className="mx-auto mt-3.5 max-w-[520px] text-center text-base leading-6 font-light text-balance
          text-white/75 sm:text-lg sm:leading-7"
        >
          Billed daily from your balance. Stay connected for as long as it lasts.
        </motion.p>

        {/* Лента выходит в поля контейнера (-mx) до краёв экрана, чтобы
            соседние карточки обрезались кромкой экрана, а не отступом.
            py/-my — запас под тень и ореол карточек: overflow-x: auto
            обрезает и по вертикали. touch-action не сужаем до pan-x —
            иначе вертикальный свайп по высокой карточке не скроллил бы
            страницу. */}
        {/* Обёртка держит затемнение краёв (.pricing-slider): псевдоэлементы
            самой ленты прокручивались бы вместе с карточками */}
        <div
          className="pricing-slider relative -mx-5 mt-10 -mb-4 sm:-mx-6 sm:mt-12
          lg:mx-0 lg:mt-[72px] lg:mb-0"
        >
          <div
            ref={carousel.scrollerRef}
            role="region"
            aria-roledescription="carousel"
            aria-label="Plans"
            onScroll={carousel.onScroll}
            className="no-scrollbar relative flex snap-x snap-mandatory gap-3
            overflow-x-auto overscroll-x-contain px-5 pt-4 pb-4 scroll-px-5
            sm:gap-4 sm:px-6 sm:scroll-px-6
            lg:grid lg:grid-cols-3 lg:items-stretch lg:gap-6 lg:overflow-visible lg:p-0"
          >
            {plans.map((plan) => (
              <PlanCard
                key={plan.name}
                plan={plan}
                visible={Boolean(reduced || inView)}
                reduced={reduced}
              />
            ))}
          </div>
        </div>

        <div className="mt-3 flex justify-center lg:hidden">
          {plans.map((plan, index) => {
            const current = index === carousel.active
            return (
              <button
                key={plan.name}
                type="button"
                aria-label={`Show ${plan.name} plan`}
                aria-current={current}
                onClick={() => carousel.goTo(index)}
                className="flex h-11 w-8 cursor-pointer items-center justify-center rounded-full
                focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-fg"
              >
                <span
                  aria-hidden
                  className={`h-1.5 rounded-full transition-[width,background-color]
                  duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none ${
                    current ? 'w-5 bg-white/80' : 'w-1.5 bg-white/25'
                  }`}
                />
              </button>
            )
          })}
        </div>

        <motion.p
          variants={textItem}
          className="mx-auto mt-5 max-w-[480px] text-center text-sm
          leading-6 font-light text-white/46 sm:mt-6 lg:mt-10"
        >
          Each extra device is +0.02$ /day
          <span aria-hidden className="mx-2 text-white/28">
            •
          </span>
          <Link
            to="/pricing/terms"
            className="inline-flex items-center gap-0.5 rounded-sm
            link-glow text-white/60 hover:text-fg focus-visible:outline-2
            focus-visible:outline-offset-4 focus-visible:outline-fg"
          >
            Full terms
            <ArrowUpRight size={13} strokeWidth={1.75} aria-hidden />
          </Link>
        </motion.p>
      </motion.div>
    </section>
  )
}
