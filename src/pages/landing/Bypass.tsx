import { lazy, Suspense, useRef } from 'react'
import { motion, useInView, useReducedMotion } from 'motion/react'

const Strands = lazy(() => import('../../components/backgrounds/Strands'))

/**
 * Вторая секция лендинга, перенесённая из Figma (frame 158:4).
 *
 * Свет за панелью — тот же Strands, что и в Hero, но с одной почти прямой
 * нитью. Canvas шире панели и не клипается ею: полупрозрачная стеклянная
 * поверхность лежит поверх нити и приглушает её внутри своих границ.
 */
export function Bypass() {
  const sectionRef = useRef<HTMLElement>(null)
  const inView = useInView(sectionRef, { once: true, amount: 0.08 })
  const reduced = useReducedMotion()

  const reveal = reduced
    ? { opacity: inView ? 1 : 0 }
    : {
        opacity: inView ? 1 : 0,
        y: inView ? 0 : 24,
        filter: inView ? 'blur(0px)' : 'blur(6px)',
      }

  return (
    <section
      id="features"
      ref={sectionRef}
      aria-labelledby="bypass-title"
      className="relative overflow-hidden bg-black py-20 sm:py-24 lg:py-[100px]"
    >
      <div className="mx-auto w-full max-w-[1108px] px-6">
        <motion.div
          className="mx-auto max-w-[693px] text-center"
          initial={false}
          animate={reveal}
          transition={{ duration: reduced ? 0 : 0.85, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2
            id="bypass-title"
            className="bg-[linear-gradient(180deg,#fff_8%,rgb(255_255_255/0.72)_100%)] bg-clip-text text-4xl leading-[1.06] font-semibold tracking-[-0.03em] text-transparent sm:text-5xl lg:text-[64px] lg:leading-[68px]"
          >
            Build to resist blocking
          </h2>

          <p className="mx-auto mt-3.5 max-w-[609px] text-base leading-6 font-light text-white/75 sm:text-lg sm:leading-7">
            Spatium is built to bypass filtering based on Deep Packet Inspection, helping your
            connection remain available on restrictive networks.
          </p>
        </motion.div>

        <motion.div
          aria-hidden
          className="relative isolate mt-11 aspect-[1060/563] min-h-72 w-full sm:min-h-0"
          initial={false}
          animate={reveal}
          transition={{
            duration: reduced ? 0 : 0.95,
            delay: reduced ? 0 : 0.1,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {inView && (
            <div className="pointer-events-none absolute -top-[30%] left-[-10%] z-0 h-[60%] w-[120%] mask-[radial-gradient(ellipse_92%_86%_at_50%_50%,black_0%,black_64%,transparent_100%)]">
              <Suspense fallback={null}>
                <Strands
                  colors={['#8ba8ff']}
                  count={1}
                  speed={0.2}
                  amplitude={0.1}
                  waviness={0.65}
                  thickness={0.52}
                  glow={2.2}
                  taper={2.4}
                  intensity={0.62}
                  saturation={0.78}
                  opacity={1}
                  scale={4.2}
                />
              </Suspense>
            </div>
          )}

          <div className="bypass-shell absolute inset-0 z-10">
            <div className="bypass-inner absolute inset-3 z-10" />
          </div>
        </motion.div>
      </div>
    </section>
  )
}
