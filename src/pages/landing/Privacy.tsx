import { useRef } from 'react'
import { motion, useInView, useReducedMotion, type Variants } from 'motion/react'

const revealContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.18, delayChildren: 0.08 } },
}

const copyContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.14 } },
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
    transition: { delayChildren: 0.05 },
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
 * Privacy section foundation. The technical diagram and abstract light layer
 * are intentionally deferred until their next design iteration is approved.
 */
export function Privacy() {
  const sectionRef = useRef<HTMLElement>(null)
  const inView = useInView(sectionRef, { once: true, amount: 0.2 })
  const reduced = useReducedMotion()

  return (
    <section
      id="privacy"
      ref={sectionRef}
      aria-labelledby="privacy-title"
      className="relative overflow-hidden bg-black py-20 sm:py-24 lg:py-[110px]"
    >
      <motion.div
        className="mx-auto grid w-full max-w-[1320px] gap-10 px-5 sm:px-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:gap-16 xl:grid-cols-[420px_720px] xl:justify-center xl:gap-24"
        variants={revealContainer}
        initial={reduced ? false : 'hidden'}
        animate={reduced || inView ? 'show' : 'hidden'}
      >
        <motion.div variants={copyContainer} className="flex flex-col lg:h-[600px] lg:py-14">
          <motion.h2
            id="privacy-title"
            variants={textItem}
            className="max-w-[420px] bg-[linear-gradient(180deg,#fff_8%,rgb(255_255_255/0.72)_100%)] bg-clip-text text-4xl leading-[1.06] font-semibold tracking-[-0.03em] text-transparent sm:text-5xl lg:text-[64px] lg:leading-[68px]"
          >
            Your traffic stays yours
          </motion.h2>

          <motion.p
            variants={textItem}
            className="mt-7 max-w-[420px] text-base leading-6 font-light text-white/70 sm:text-lg sm:leading-7 lg:mt-auto"
          >
            Spatium hides your IP, keeps DNS inside the tunnel, and retains no activity history.
          </motion.p>
        </motion.div>

        <motion.div
          aria-hidden
          variants={blockItem}
          className="relative h-[430px] min-w-0 sm:h-[500px] lg:h-[600px]"
        >
          <div className="privacy-shell absolute inset-0 z-10">
            <div className="privacy-inner absolute inset-3" />
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
