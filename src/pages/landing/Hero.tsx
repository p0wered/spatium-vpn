import { lazy, Suspense, useState } from 'react'
import { motion, useReducedMotion, type Variants } from 'motion/react'
import { useNavigate } from 'react-router'
import { Button } from '../../components/Button'
import { GrainOverlay } from '../../components/GrainOverlay'
import { scrollToSection } from '../../lib/scroll'

// WebGL-фон — ленивым чанком, чтобы не тормозить первый рендер
const Strands = lazy(() => import('../../components/backgrounds/Strands'))
const ColorBends = lazy(() => import('../../components/backgrounds/ColorBends'))
const DotField = lazy(() => import('../../components/backgrounds/DotField'))

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15, delayChildren: 0.3 } },
}

interface HeroProps {
  background?: 'strands' | 'color-bends'
  contentLayout?: 'centered' | 'left'
}

export function Hero({ background = 'strands', contentLayout = 'centered' }: HeroProps) {
  const reduced = useReducedMotion()
  const navigate = useNavigate()
  const isLeftAligned = contentLayout === 'left'
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
      {background === 'color-bends' ? (
        <>
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.6, delay: 0.1 }}
          >
            <Suspense fallback={null}>
              <ColorBends
                colors={['#e1e8ff', '#84a2ff']}
                scale={3}
                transparent={false}
                bandWidth={8}
                speed={0.2}
                frequency={2}
                noise={0.08}
                rotation={90}
                iterations={1}
                intensity={1}
                mouseInfluence={0}
                warpStrength={1}
              />
            </Suspense>
          </motion.div>

          {/* Общее затемнение приглушает пересвеченные участки Color Bends. */}
          <div aria-hidden className="pointer-events-none absolute inset-0 z-[1] bg-black/30" />

          {/* Интерактивная сетка поверх лент, адаптированная из референса DotField. */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-[2] opacity-75"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.75 }}
            transition={{ duration: 1.4, delay: 0.35 }}
          >
            <Suspense fallback={null}>
              <DotField
                dotRadius={1.5}
                dotSpacing={17}
                cursorRadius={360}
                bulgeStrength={48}
                glowRadius={220}
                gradientFrom="rgba(225, 232, 255, 0.42)"
                gradientTo="rgba(132, 162, 255, 0.24)"
                glowColor="rgba(2, 4, 10, 0.9)"
              />
            </Suspense>
          </motion.div>

          {/* Локальный scrim сохраняет контраст текста на движущихся лентах. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-[3] bg-[radial-gradient(ellipse_58%_58%_at_32%_48%,rgb(0_0_0/0.48),transparent_75%)]"
          />

          {/* Полностью гасим оба фоновых слоя к кромке следующей секции. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 z-[4] h-[38svh] bg-[linear-gradient(to_bottom,transparent_0%,rgb(0_0_0/0.72)_62%,black_100%)]"
          />
        </>
      ) : (
        /* Свет поверх контента (z-20) — «наезжает» на текст; pointer-events-none
           обязателен, иначе слой перехватывает клики по кнопкам и выделение.
           Из-за translate кромки канваса попадают в кадр (верхняя — сверху,
           нижняя — на границе со следующей секцией) — гасим обе градиентной
           маской, чтобы свечение не обрывалось ступенькой */
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
      )}

      {/* Grain — верхним слоем, чтобы ложился и на свет; к низу секции гаснет,
          иначе на границе с чёрной страницей виден перепад яркости */}
      <GrainOverlay className="z-30 mask-[linear-gradient(to_bottom,black_82%,transparent)]" />

      <motion.div
        className={
          isLeftAligned
            ? 'relative z-10 mx-auto flex h-full w-full max-w-6xl flex-col px-6 text-left'
            : 'relative z-10 flex h-full flex-col items-center px-6 text-center'
        }
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.h1
          variants={item}
          className={`${
            isLeftAligned
              ? 'mt-[30svh] max-w-3xl sm:text-[5.5rem]'
              : 'mt-[20svh] max-w-4xl sm:text-[7rem]'
          } text-5xl font-semibold tracking-tighter text-balance [text-shadow:0_2px_32px_rgb(0_0_0/0.55)]`}
        >
          Move unseen. Arrive instantly.
        </motion.h1>

        <div className={isLeftAligned ? 'mt-4' : 'mt-auto mb-[12svh]'}>
          <motion.p
            variants={item}
            className="max-w-xl text-md md:text-lg text-balance leading-6 text-fg [text-shadow:0_1px_16px_rgb(0_0_0/0.7)]"
          >
            Fast, private VPN that just works — bypass censorship, stay anonymous, game on
            low-latency servers.
          </motion.p>

          <motion.div
            variants={item}
            className={`mt-6 flex flex-wrap items-center gap-3 ${
              isLeftAligned ? '' : 'justify-center'
            }`}
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
