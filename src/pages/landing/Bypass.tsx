import { useRef } from 'react'
import { motion, useInView, useReducedMotion, type Variants } from 'motion/react'

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
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.9,
      ease: [0.22, 1, 0.36, 1],
      delayChildren: 0.15,
    },
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
        className="mx-auto w-full max-w-[1108px] px-6"
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
          className="relative isolate mt-11 aspect-[1060/563] min-h-72 w-full sm:min-h-0"
          variants={blockItem}
        >
          <div className="bypass-shell absolute inset-0 z-10">
            <div className="bypass-inner absolute inset-3 z-10" />
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}
