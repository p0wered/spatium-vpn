import { lazy, Suspense, useState } from 'react'
import { motion, useReducedMotion, type Variants } from 'motion/react'
import { useNavigate } from 'react-router'
import { Button } from '../../components/Button'
import { GrainOverlay } from '../../components/GrainOverlay'
import { scrollToSection } from '../../lib/scroll'
import { LANDING_STRAND_COLORS } from '../../components/backgrounds/lightPalette'

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
    // min-h: на низких экранах (SE, телефон в landscape) h-svh сжимал секцию
    // настолько, что заголовок наезжал на подзаголовок и кнопки.
    <section className="relative h-svh min-h-[34rem] overflow-hidden">
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
           нижняя — на границе со следующей секцией) — обе гасит сам шейдер
           (verticalFade), чтобы свечение не обрывалось ступенькой. CSS-маска
           здесь стоила полноэкранной внеэкранной поверхности на каждый кадр */
        <motion.div
          aria-hidden
          // На низких экранах (≤620px) лента поднята: иначе она ложилась
          // ровно на подзаголовок, а не в просвет между ним и заголовком
          className="pointer-events-none absolute inset-0 z-20 translate-y-[5%] [@media(max-height:620px)]:-translate-y-[4%]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.6, delay: 0.1 }}
        >
          <Suspense fallback={null}>
            <Strands
              colors={LANDING_STRAND_COLORS}
              count={5}
              speed={0.35}
              thickness={0.5}
              glow={2}
              intensity={isNarrow ? 0.4 : 0.55}
              scale={isNarrow ? 1.2 : 1.95}
              refraction={1}
              dispersion={1.2}
              verticalFade={[0.3, 0.72, 0.94]}
              // Нити — мягкое свечение шириной в десятки пикселей, резких
              // кромок в кадре нет. Полный retina-буфер даёт вдвое больше
              // пикселей, чем нужно этой картинке.
              dpr={1.5}
            />
          </Suspense>
        </motion.div>
      )}

      {/* Grain — верхним слоем, чтобы ложился и на свет; к низу секции гаснет,
          иначе на границе с чёрной страницей виден перепад яркости.
          Слоя два: маска нужна только нижним 18%, где зерно затухает, а её
          растр браузер пересчитывает при каждой перерисовке секции — на всю
          высоту экрана это было впятеро дороже. Сдвиг фона на высоту верхнего
          слоя (секция — ровно 100svh) продолжает тот же тайл без шва */}
      <GrainOverlay className="z-30" style={{ bottom: '18%' }} />
      <GrainOverlay
        className="z-30 mask-[linear-gradient(to_bottom,black,transparent)]"
        style={{ top: '82%', backgroundPositionY: 'calc(-0.82 * max(100svh, 34rem))' }}
      />

      <motion.div
        className={
          isLeftAligned
            ? 'landing-container relative z-10 flex h-full flex-col text-left'
            : 'landing-container relative z-10 flex h-full flex-col items-center text-center'
        }
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.h1
          variants={item}
          // На телефоне кегль тянется по ширине: две строки при любой ширине
          // от 320px — фиксированные 3rem ломали заголовок на 3–4 строки,
          // и он уходил под световую ленту.
          className={`${
            isLeftAligned
              ? 'mt-[30svh] max-w-3xl sm:text-[5.5rem]'
              : 'mt-[max(6rem,24svh)] max-w-4xl sm:text-[6rem]'
          } text-[clamp(2.5rem,12.4vw,3.5rem)] leading-[1.04] font-semibold tracking-tighter text-balance [text-shadow:0_2px_32px_rgb(0_0_0/0.55)] sm:leading-none`}
        >
          Move unseen. Arrive instantly.
        </motion.h1>

        <div
          className={
            isLeftAligned
              ? 'mt-4'
              : 'mt-auto mb-[max(2rem,11svh)] flex w-full flex-col items-center pt-10'
          }
        >
          <motion.p
            variants={item}
            className="max-w-[21rem] text-[0.9375rem] leading-6 text-balance text-fg/90 [text-shadow:0_1px_16px_rgb(0_0_0/0.7)] sm:max-w-xl sm:text-base sm:text-fg md:text-lg"
          >
            Fast, private VPN that just works — bypass censorship, stay anonymous, game on
            low‑latency servers.
          </motion.p>

          {/* Телефон: две равные кнопки в ряд, а где не помещаются (<356px) —
              стопкой на всю ширину. Раньше они переносились по одной и
              получались разной ширины. */}
          <motion.div
            variants={item}
            className={`mt-6 flex w-full max-w-sm flex-wrap items-center gap-3 sm:w-auto sm:max-w-none ${
              isLeftAligned ? '' : 'justify-center'
            }`}
          >
            <Button
              size="lg"
              className="grow basis-[9.5rem] rounded-full px-4! whitespace-nowrap sm:min-w-40 sm:grow-0 sm:basis-auto sm:px-7!"
              onClick={() => navigate('/login')}
            >
              Get SpatiumVPN
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="grow basis-[9.5rem] rounded-full px-4! whitespace-nowrap sm:min-w-40 sm:grow-0 sm:basis-auto sm:px-7!"
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
