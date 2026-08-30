import { lazy, Suspense, useRef } from 'react'
import { motion, useInView, useReducedMotion, type Variants } from 'motion/react'
import { BypassDiagram } from '../../components/landing/BypassDiagram'

const IceRidge = lazy(() => import('../../components/backgrounds/IceRidge'))

const revealContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15, delayChildren: 0.08 } },
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

const blockItem: Variants = {
  hidden: {},
  show: {
    transition: {
      delayChildren: 0.05,
    },
  },
}

const blockVeil: Variants = {
  hidden: { opacity: 1 },
  show: {
    opacity: 0,
    transition: { duration: 0.8, ease: [0.23, 1, 0.32, 1] },
  },
}

/**
 * Вторая секция лендинга, перенесённая из Figma (frame 158:4).
 */
export function Bypass() {
  const sectionRef = useRef<HTMLElement>(null)
  // 8% срабатывали ещё до появления контента: верхний padding секции больше
  // этого порога, поэтому reveal успевал завершиться за нижней кромкой экрана.
  const inView = useInView(sectionRef, { once: true, amount: 0.12 })
  const reduced = useReducedMotion()

  return (
    <section
      id="features"
      ref={sectionRef}
      aria-labelledby="bypass-title"
      className="relative overflow-hidden bg-black py-20 sm:py-24 lg:py-[100px]"
    >
      <motion.div
        className="mx-auto w-full max-w-[1108px] px-3"
        variants={revealContainer}
        initial={reduced ? false : 'hidden'}
        animate={reduced || inView ? 'show' : 'hidden'}
      >
        <motion.h2
          id="bypass-title"
          variants={textItem}
          className="mx-auto max-w-[693px] bg-[linear-gradient(180deg,#fff_8%,rgb(255_255_255/0.72)_100%)] bg-clip-text text-center text-4xl leading-[1.06] font-semibold tracking-[-0.03em] text-transparent sm:text-5xl lg:text-[64px] lg:leading-[68px]"
        >
          Build to resist blocking
        </motion.h2>

        <motion.p
          variants={textItem}
          className="mx-auto mt-3.5 max-w-[609px] text-center text-base leading-6 font-light text-white/75 sm:text-lg sm:leading-7"
        >
          Spatium is built to bypass filtering based on Deep Packet Inspection, helping your
          connection remain available on restrictive networks.
        </motion.p>

        <motion.div
          aria-hidden
          className="relative isolate mx-auto mt-11 aspect-[360/430] min-h-[420px] w-full max-w-[480px] lg:aspect-[1060/563] lg:min-h-0 lg:max-w-none"
          variants={blockItem}
        >
          <div className="pointer-events-none absolute inset-x-[-28%] top-0 z-0 h-40 -translate-y-1/2 sm:inset-x-[-15%] sm:h-56 lg:inset-x-[-11%] lg:h-64">
            <Suspense fallback={null}>
              <IceRidge active={Boolean(reduced || inView)} />
            </Suspense>
          </div>

          <div className="bypass-shell absolute inset-0 z-10">
            <div className="bypass-inner absolute inset-3 z-10 bg-black/30">
              <BypassDiagram active={Boolean(reduced || inView)} reducedMotion={Boolean(reduced)} />
            </div>
          </div>
          <motion.div
            variants={blockVeil}
            className="pointer-events-none absolute inset-0 z-20 rounded-[24px] bg-black"
          />
        </motion.div>
      </motion.div>
    </section>
  )
}
