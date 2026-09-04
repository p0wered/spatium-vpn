import { lazy, Suspense, useRef } from 'react'
import { motion, useInView, useReducedMotion, type Variants } from 'motion/react'

const OrbitalHorizon = lazy(() => import('../../components/backgrounds/OrbitalHorizon'))

const textItem: Variants = {
  hidden: { opacity: 0, y: 24, filter: 'blur(6px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
  },
}

const testimonials = [
  {
    quote:
      'Spatium stays out of the way. I connect once and rarely need to open the app again.',
    name: 'Daria Morozova',
    detail: 'Product designer, Moscow',
  },
  {
    quote:
      'Switching locations is quick, and the connection stays steady while I work with large files.',
    name: 'Mikhail Sokolov',
    detail: 'Backend engineer, Saint Petersburg',
  },
  {
    quote:
      'Public Wi-Fi feels less stressful when the tunnel is active and easy to check.',
    name: 'Alina Volkova',
    detail: 'Photographer, Kazan',
  },
  {
    quote:
      'I can join evening matches without spending ten minutes testing servers before every session.',
    name: 'Ilya Lebedev',
    detail: 'Game developer, Novosibirsk',
  },
  {
    quote:
      'The interface is calm, clear, and never turns basic privacy into another technical project.',
    name: 'Sofia Orlova',
    detail: 'Marketing strategist, Yekaterinburg',
  },
  {
    quote:
      'It is fast enough for daily editing work and simple enough that I never have to troubleshoot it.',
    name: 'Artem Kuznetsov',
    detail: 'Film editor, Kaliningrad',
  },
  {
    quote:
      'Everything important is visible at a glance, while the rest stays quietly in the background.',
    name: 'Mara Voss',
    detail: 'Product designer, Berlin',
  },
  {
    quote:
      'The server list feels responsive and predictable when I move between networks during the day.',
    name: 'Kenji Arai',
    detail: 'Independent developer, Kyoto',
  },
  {
    quote:
      'I wanted a VPN that felt like a utility, not a dashboard I had to keep managing.',
    name: 'Tomás Vidal',
    detail: 'Film editor, Lisbon',
  },
  {
    quote:
      'The experience is understated and dependable. That is exactly what I want from privacy software.',
    name: 'Noor El-Sayed',
    detail: 'UX researcher, Amsterdam',
  },
] as const

function CardSequence() {
  return (
    <div className="testimonial-sequence">
      {testimonials.map((testimonial, index) => (
        <article className="testimonial-card" key={testimonial.name}>
          <p className="testimonial-card-copy">{testimonial.quote}</p>

          <footer className="testimonial-card-footer">
            <div>
              <strong>{testimonial.name}</strong>
              <span>{testimonial.detail}</span>
            </div>
            <span className="testimonial-card-index">
              {String(index + 1).padStart(2, '0')}
            </span>
          </footer>
        </article>
      ))}
    </div>
  )
}

function MarqueeRow({ direction }: { direction: 'left' | 'right' }) {
  return (
    <div className="testimonial-marquee" aria-hidden>
      <div className={`testimonial-track testimonial-track-${direction}`}>
        <CardSequence />
        <CardSequence />
      </div>
    </div>
  )
}

export function Testimonials() {
  const sectionRef = useRef<HTMLElement>(null)
  const inView = useInView(sectionRef, { amount: 0.08 })
  const reduced = useReducedMotion()

  return (
    <section
      id="testimonials"
      ref={sectionRef}
      aria-labelledby="testimonials-title"
      className={`testimonials-section relative isolate overflow-hidden bg-black py-24 sm:py-28 lg:py-[132px] ${
        reduced || inView ? 'is-active' : ''
      }`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
      >
        <Suspense fallback={null}>
          <OrbitalHorizon active={Boolean(reduced || inView)} />
        </Suspense>
      </div>

      <motion.div
        className="relative z-10 mx-auto grid w-full max-w-[1320px] gap-6 px-5 sm:px-6 lg:grid-cols-12 lg:items-end"
        initial={reduced ? false : 'hidden'}
        animate={reduced || inView ? 'show' : 'hidden'}
      >
        <motion.h2
          id="testimonials-title"
          variants={textItem}
          className="max-w-[520px] text-4xl leading-[1.04] font-semibold tracking-[-0.03em] text-balance text-white/90 sm:text-5xl lg:col-span-7 lg:text-[64px] lg:leading-[68px]"
        >
          Privacy, in their words
        </motion.h2>

        <motion.p
          variants={textItem}
          className="max-w-[410px] text-base leading-6 font-light text-white/68 sm:text-lg sm:leading-7 lg:col-span-4 lg:col-start-9 lg:justify-self-end lg:text-right"
        >
          Approved customer stories will live here once the review copy is ready.
        </motion.p>
      </motion.div>

      <ul className="sr-only">
        {testimonials.map((testimonial) => (
          <li key={testimonial.name}>
            <blockquote>{testimonial.quote}</blockquote>
            <p>
              {testimonial.name}, {testimonial.detail}
            </p>
          </li>
        ))}
      </ul>

      <div className="relative z-10 mt-24 space-y-5 sm:mt-28 sm:space-y-6 lg:mt-[168px] lg:space-y-7">
        <MarqueeRow direction="right" />
        <MarqueeRow direction="left" />
      </div>
    </section>
  )
}
