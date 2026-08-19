import { lazy, Suspense, useState } from 'react'
import { motion, useReducedMotion, type Variants } from 'motion/react'
import { useNavigate } from 'react-router'
import { Button } from '../../components/Button'
import { GrainOverlay } from '../../components/GrainOverlay'
import { scrollToSection } from '../../lib/scroll'

// WebGL-фон — ленивым чанком, чтобы не тормозить первый рендер
const Strands = lazy(() => import('../../components/backgrounds/Strands'))

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15, delayChildren: 0.3 } },
}

export function Hero() {
  const reduced = useReducedMotion()
  const navigate = useNavigate()
  // Портретный вьюпорт «зумит» шейдер (uv нормализуется по высоте) в яркое
  // ядро — на мобильных отдаём меньший масштаб и интенсивность. Фон монтируется
  // один раз, поэтому достаточно значения на момент рендера.
  const [isNarrow] = useState(() => window.matchMedia('(max-width: 640px)').matches)

  const item: Variants = {
    hidden: reduced ? { opacity: 0 } : { opacity: 0, y: 28, filter: 'blur(6px)' },
    show: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
    },
  }

  return (
    <section className="relative h-svh overflow-hidden">
      {/* Свет поверх контента (z-20) — «наезжает» на текст; pointer-events-none
          обязателен, иначе слой перехватывает клики по кнопкам и выделение.
          Из-за translate кромки канваса попадают в кадр (верхняя — сверху,
          нижняя — на границе со следующей секцией) — гасим обе градиентной
          маской, чтобы свечение не обрывалось ступенькой */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-20 translate-y-[5%] mask-[linear-gradient(to_bottom,transparent,black_30%,black_72%,transparent_94%)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.6, delay: 0.1 }}
      >
        <Suspense fallback={null}>
          <Strands
            colors={['#b4d2ff', '#426eff', '#ffffff']}
            count={5}
            speed={0.35}
            thickness={0.5}
            glow={2}
            intensity={isNarrow ? 0.4 : 0.55}
            scale={isNarrow ? 1.2 : 1.95}
            refraction={1}
            dispersion={1.2}
          />
        </Suspense>
      </motion.div>

      {/* Grain — верхним слоем, чтобы ложился и на свет; к низу секции гаснет,
          иначе на границе с чёрной страницей виден перепад яркости */}
      <GrainOverlay className="z-30 mask-[linear-gradient(to_bottom,black_82%,transparent)]" />

      <motion.div
        className="relative z-10 flex h-full flex-col items-center px-6 text-center"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.h1
          variants={item}
          className="mt-[20svh] max-w-4xl text-5xl font-semibold tracking-tighter text-balance [text-shadow:0_2px_32px_rgb(0_0_0/0.55)] sm:text-[7rem]"
        >
          Move unseen. Arrive instantly.
        </motion.h1>

        <div className="mt-auto mb-[12svh]">
          <motion.p
            variants={item}
            className="max-w-xl text-md md:text-lg text-balance leading-6 text-fg [text-shadow:0_1px_16px_rgb(0_0_0/0.7)]"
          >
            Fast, private VPN that just works — bypass censorship, stay anonymous, game on
            low-latency servers.
          </motion.p>

          <motion.div
            variants={item}
            className="mt-6 flex flex-wrap items-center justify-center gap-3"
          >
            <Button
              size="lg"
              className="rounded-full min-w-40"
              onClick={() => navigate('/login')}
            >
              Get SpatiumVPN
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="rounded-full min-w-40"
              onClick={() => scrollToSection('pricing')}
            >
              View pricing
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </section>
  )
}
