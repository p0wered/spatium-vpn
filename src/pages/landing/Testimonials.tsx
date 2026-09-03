import { useRef } from 'react'
import { motion, useInView, useReducedMotion, type Variants } from 'motion/react'

const textItem: Variants = {
  hidden: { opacity: 0, y: 24, filter: 'blur(6px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
  },
}

const CARD_COUNT = 4

function CardSequence() {
  return (
    <div className="testimonial-sequence" aria-hidden>
      {Array.from({ length: CARD_COUNT }, (_, index) => (
        <div className="testimonial-card" key={index} />
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

/**
 * The review section is deliberately content-neutral for now: the cards hold
 * the approved structure without inventing customer quotes. The reserved gap
 * between the heading and the ribbons is where the WebGL layer will live.
 */
export function Testimonials() {
  const sectionRef = useRef<HTMLElement>(null)
  const inView = useInView(sectionRef, { amount: 0.08 })
  const reduced = useReducedMotion()

  return (
    <section
      id="testimonials"
      ref={sectionRef}
      aria-labelledby="testimonials-title"
      className={`testimonials-section relative overflow-hidden bg-black py-24 sm:py-28 lg:py-[132px] ${
        reduced || inView ? 'is-active' : ''
      }`}
    >
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

      <div className="relative z-10 mt-24 space-y-5 sm:mt-28 sm:space-y-6 lg:mt-[168px] lg:space-y-7">
        <MarqueeRow direction="right" />
        <MarqueeRow direction="left" />
      </div>
    </section>
  )
}
