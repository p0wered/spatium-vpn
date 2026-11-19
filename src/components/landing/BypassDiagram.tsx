import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react'
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useTransform,
  type MotionValue,
} from 'motion/react'
import { DESKTOP_QUERY, useMediaQuery } from '../../lib/useMediaQuery'

interface BypassDiagramProps {
  active: boolean
  reducedMotion: boolean
}

const diagramTransition = {
  duration: 0.72,
  delay: 0.9,
  ease: [0.22, 1, 0.36, 1] as const,
}

/**
 * Сюжет диаграммы — два прогона через один и тот же вход (VLESS + Reality).
 * Проба и клиент начинают одинаковым TLS-рукопожатием; после проверки проба
 * уходит на обычный сайт, а клиент с доказательством — в скрытый туннель.
 *
 * Всё выводится из одного motion value `time` (секунды внутри цикла).
 * STATIC — кадр без анимации (reduced motion): схема в состоянии покоя.
 */
const STATIC = -1
const PROBE_AT = 0.3
const CLIENT_AT = 3.6
const FADE_AT = 8
const FADE = 0.45
const CYCLE = 8.7
const FIRST_START_DELAY = 1.3

/** Вехи одного прогона, в секундах от его начала. */
const RUN = {
  leave: 0.1,
  handshakeIn: 0.7,
  handshakeOut: 1,
  verifyIn: 1.15,
  verifyOut: 1.7,
  branchIn: 2.1,
  branchOut: 2.35,
  arrive: 2.7,
}
const TUNNEL_AT = CLIENT_AT + RUN.branchIn
const HATCH_PERIOD = 11
// Штриховка за время работы туннеля сдвигается на целое число периодов,
// поэтому перезапуск цикла не даёт скачка.
const HATCH_FLOW = FADE_AT + FADE - TUNNEL_AT
const HATCH_SPEED = (HATCH_PERIOD * 4) / HATCH_FLOW
/** Яркость свечения активной точки и знака — едва заметный ореол. */
const GLOW_OPACITY = 0.55

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))
const rise = (x: number, at: number, duration = 0.18) => clamp01((x - at) / duration)
const flash = (x: number, from: number, to: number) => rise(x, from, 0.12) * (1 - rise(x, to, 0.3))
const fadeAll = (t: number) => 1 - rise(t, FADE_AT, FADE)
/** Результат пробы гаснет, когда стартует клиент. */
const probeFade = (t: number) => 1 - rise(t, CLIENT_AT - 0.25, 0.4)
const gray = (level: number) => {
  const v = Math.round(level)
  return `rgb(${v} ${v} ${v})`
}

const levels = {
  probe: (t: number) => rise(t - PROBE_AT, 0) * probeFade(t),
  client: (t: number) => rise(t - CLIENT_AT, 0) * fadeAll(t),
  handshake: (t: number) =>
    Math.max(
      flash(t - PROBE_AT, RUN.handshakeIn, RUN.handshakeOut),
      flash(t - CLIENT_AT, RUN.handshakeIn, RUN.handshakeOut),
    ),
  // Без доказательства проверка отзывается слабее.
  verify: (t: number) =>
    Math.max(
      flash(t - PROBE_AT, RUN.verifyIn, RUN.verifyOut - 0.1) * 0.5,
      flash(t - CLIENT_AT, RUN.verifyIn, RUN.verifyOut),
    ),
  mark: (t: number) => rise(t - CLIENT_AT, RUN.verifyIn + 0.3, 0.2) * fadeAll(t),
  web: (t: number) => rise(t - PROBE_AT, RUN.branchIn) * probeFade(t),
  site: (t: number) => rise(t - PROBE_AT, RUN.arrive - 0.05, 0.2) * probeFade(t),
  tunnel: (t: number) => rise(t - CLIENT_AT, RUN.branchIn) * fadeAll(t),
  proxy: (t: number) => rise(t - CLIENT_AT, RUN.arrive - 0.05, 0.2) * fadeAll(t),
}

interface Rect {
  x: number
  y: number
  w: number
  h: number
}

interface TextStyle {
  cap: number
  main: number
  capDy: number
  mainDy: number
  padX: number
}

interface Layout {
  id: string
  className: string
  width: number
  height: number
  left: number
  right: number
  header: { y: number; font: number; spacing: number; text: [string, string | null] }
  tag: { x: number; y: number; font: number; text: string } | null
  caption: { y: number; font: number; text: string } | null
  sources: [Rect, Rect]
  outputs: [Rect, Rect]
  server: Rect
  cells: { handshake: Rect; verify: Rect; web: Rect; tunnel: Rect }
  /** Низкие ячейки входа и проверки на мобильной: подпись и значение в одну строку. */
  inlineCells: boolean
  radius: { box: number; server: number; cell: number }
  box: TextStyle
  cell: TextStyle
  mark: { w: number; h: number }
  /**
   * Маршруты пробы и клиента: от источника до выхода, сквозь сервер.
   * Слияние перед входом и развилка после проверки — под прямым углом.
   */
  routes: [string, string]
  routeLength: number
  /** Положение ячеек вдоль маршрута. */
  stations: {
    handshake: [number, number]
    verify: [number, number]
    branch: [number, number]
  }
  pulse: number
  copy: {
    sources: [[string, string], [string, string]]
    outputs: [[string, string], [string, string]]
    handshake: [string, string]
    verify: string
    web: [string, string]
    tunnel: [string, string]
  }
}

const desktopLayout: Layout = {
  id: 'desktop',
  className: 'hidden h-full w-full lg:block',
  width: 1060,
  height: 563,
  left: 56,
  right: 1004,
  header: {
    y: 65,
    font: 11,
    spacing: 1.7,
    text: ['ONE ENDPOINT · TWO OBSERVER STATES', 'AUTHENTICATED CAMOUFLAGE'],
  },
  tag: { x: 302, y: 143, font: 10, text: 'SPATIUM ENDPOINT · PORT 443' },
  caption: {
    y: 498,
    font: 12,
    text: 'The public surface remains plausible while authentication gates access to the proxy behind it.',
  },
  sources: [
    { x: 56, y: 168, w: 170, h: 82 },
    { x: 56, y: 328, w: 170, h: 82 },
  ],
  outputs: [
    { x: 834, y: 168, w: 170, h: 82 },
    { x: 834, y: 328, w: 170, h: 82 },
  ],
  // Внутренний отступ 20 по обеим осям — как зазоры между ячейками и шаг точечной сетки.
  server: { x: 302, y: 157, w: 456, h: 264 },
  cells: {
    handshake: { x: 322, y: 257, w: 132, h: 64 },
    verify: { x: 474, y: 257, w: 82, h: 64 },
    web: { x: 596, y: 177, w: 142, h: 64 },
    tunnel: { x: 596, y: 337, w: 142, h: 64 },
  },
  inlineCells: false,
  radius: { box: 12, server: 14, cell: 6 },
  box: { cap: 11, main: 12, capDy: 32, mainDy: 59, padX: 20 },
  cell: { cap: 9, main: 10.5, capDy: 25, mainDy: 46, padX: 14 },
  mark: { w: 36, h: 19 },
  routes: [
    'M226 209H258Q266 209 266 217V289H576V217Q576 209 584 209H834',
    'M226 369H258Q266 369 266 361V289H576V361Q576 369 584 369H834',
  ],
  routeLength: 761.3,
  stations: { handshake: [172.6, 304.6], verify: [324.6, 406.6], branch: [523.3, 665.3] },
  pulse: 36,
  copy: {
    sources: [
      ['ACTIVE PROBE', 'NO CLIENT PROOF'],
      ['VALID CLIENT', 'CLIENT PROOF'],
    ],
    outputs: [
      ['PLAUSIBLE OUTPUT', 'ORDINARY SITE'],
      ['PRIVATE OUTPUT', 'PROXY SESSION'],
    ],
    handshake: ['SHARED ENTRY', 'TLS HANDSHAKE'],
    verify: 'VERIFY',
    web: ['PUBLIC SURFACE', 'WEB RESPONSE'],
    tunnel: ['VLESS · REALITY', 'ENCRYPTED TUNNEL'],
  },
}

const mobileLayout: Layout = {
  id: 'mobile',
  className: 'h-full w-full lg:hidden',
  width: 360,
  height: 430,
  left: 18,
  right: 342,
  // Шрифты мобильной схемы — в единицах viewBox 360: панель на телефоне ~310px,
  // и прежние 7–8 превращались в 6px на экране.
  header: { y: 28, font: 9, spacing: 1.2, text: ['ONE ENDPOINT · TWO OBSERVERS', null] },
  tag: null,
  caption: null,
  sources: [
    { x: 18, y: 46, w: 148, h: 52 },
    { x: 194, y: 46, w: 148, h: 52 },
  ],
  outputs: [
    { x: 18, y: 344, w: 148, h: 52 },
    { x: 194, y: 344, w: 148, h: 52 },
  ],
  server: { x: 18, y: 138, w: 324, h: 182 },
  cells: {
    handshake: { x: 30, y: 150, w: 300, h: 36 },
    verify: { x: 30, y: 198, w: 300, h: 36 },
    web: { x: 30, y: 258, w: 124, h: 50 },
    tunnel: { x: 206, y: 258, w: 124, h: 50 },
  },
  inlineCells: true,
  radius: { box: 11, server: 14, cell: 6 },
  box: { cap: 9, main: 11.5, capDy: 21, mainDy: 39, padX: 14 },
  cell: { cap: 8, main: 10, capDy: 20, mainDy: 37, padX: 11 },
  mark: { w: 30, h: 16 },
  routes: [
    'M92 98V104Q92 112 100 112H180V246H100Q92 246 92 254V344',
    'M268 98V104Q268 112 260 112H180V246H260Q268 246 268 254V344',
  ],
  routeLength: 415.3,
  stations: { handshake: [136.6, 172.6], verify: [184.6, 220.6], branch: [329.3, 379.3] },
  pulse: 24,
  copy: {
    sources: [
      ['ACTIVE PROBE', 'NO CLIENT PROOF'],
      ['VALID CLIENT', 'CLIENT PROOF'],
    ],
    outputs: [
      ['PUBLIC OUTPUT', 'ORDINARY SITE'],
      ['PRIVATE OUTPUT', 'PROXY SESSION'],
    ],
    handshake: ['SHARED ENTRY', 'TLS HANDSHAKE'],
    verify: 'VERIFY',
    web: ['PUBLIC SURFACE', 'WEB RESPONSE'],
    tunnel: ['VLESS · REALITY', 'ENCRYPTED TUNNEL'],
  },
}

interface Timeline {
  time: MotionValue<number>
  layout: Layout
}

const TimelineContext = createContext<Timeline | null>(null)

function useTimeline() {
  const timeline = useContext(TimelineContext)
  if (!timeline) throw new Error('BypassDiagram timeline is missing')
  return timeline
}

/** Яркость элемента 0…1 как функция времени цикла. */
function useLevel(level: (t: number) => number) {
  const { time } = useTimeline()
  return useTransform(time, (t) => (t === STATIC ? 0 : level(t)))
}

/** Положение головы импульса вдоль маршрута в момент x от старта прогона. */
function pulsePosition(x: number, layout: Layout) {
  const { stations, routeLength, pulse } = layout
  const frames: [number, number][] = [
    [RUN.leave, 0],
    [RUN.handshakeIn, stations.handshake[0]],
    [RUN.handshakeOut, stations.handshake[1]],
    [RUN.verifyIn, stations.verify[0]],
    [RUN.verifyOut, stations.verify[1]],
    [RUN.branchIn, stations.branch[0]],
    [RUN.branchOut, stations.branch[1]],
    [RUN.arrive, routeLength + pulse],
  ]
  if (x <= frames[0][0]) return 0
  for (let index = 1; index < frames.length; index += 1) {
    const [toTime, toPosition] = frames[index]
    if (x <= toTime) {
      const [fromTime, fromPosition] = frames[index - 1]
      return fromPosition + ((x - fromTime) / (toTime - fromTime)) * (toPosition - fromPosition)
    }
  }
  return routeLength + pulse
}

/** Короткий светлый отрезок, бегущий по маршруту. Внутри ячеек его закрывают сами ячейки. */
function Pulse({ route, startAt }: { route: string; startAt: number }) {
  const { time, layout } = useTimeline()
  const strokeDashoffset = useTransform(time, (t) =>
    t === STATIC ? layout.pulse : layout.pulse - pulsePosition(t - startAt, layout),
  )
  const opacity = useTransform(time, (t) =>
    t !== STATIC && t - startAt > RUN.leave && t - startAt < RUN.arrive ? 1 : 0,
  )
  const dash = {
    d: route,
    fill: 'none',
    stroke: 'white',
    strokeLinecap: 'round' as const,
    strokeDasharray: `${layout.pulse} ${layout.routeLength * 2}`,
  }

  return (
    <motion.g style={{ opacity }}>
      <motion.path {...dash} strokeWidth="6" strokeOpacity="0.12" style={{ strokeDashoffset }} />
      <motion.path {...dash} strokeWidth="1.5" style={{ strokeDashoffset }} />
    </motion.g>
  )
}

/** Поток по установленному туннелю: пунктир течёт от клиента к прокси-сессии. */
function Stream({ route }: { route: string }) {
  const { time } = useTimeline()
  const opacity = useLevel(levels.proxy)
  const strokeDashoffset = useTransform(time, (t) => (t === STATIC ? 0 : -(t - CLIENT_AT) * 46))

  return (
    <motion.path
      d={route}
      fill="none"
      stroke="white"
      strokeOpacity="0.7"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeDasharray="3 10"
      style={{ opacity, strokeDashoffset }}
    />
  )
}

function LitText({
  level,
  from,
  to,
  children,
  ...props
}: {
  level: MotionValue<number>
  from: number
  to: number
  children: ReactNode
} & React.SVGProps<SVGTextElement>) {
  const fill = useTransform(level, (value) => gray(from + (to - from) * value))
  return (
    <motion.g style={{ fill }}>
      <text {...props}>{children}</text>
    </motion.g>
  )
}

/** Штриховка «скрытого» блока; пока туннель работает, она течёт. */
function Hatch({
  name,
  rect,
  rx,
  level,
}: {
  name: string
  rect: Rect
  rx: number
  level: MotionValue<number>
}) {
  const { time, layout } = useTimeline()
  const pad = layout.inlineCells ? 5 : 7
  const clipId = `bypass-clip-${layout.id}-${name}`
  const x = useTransform(time, (t) =>
    t === STATIC
      ? 0
      : (Math.min(Math.max(t - TUNNEL_AT, 0), HATCH_FLOW) * HATCH_SPEED) % HATCH_PERIOD,
  )
  const sheet = {
    x: rect.x - HATCH_PERIOD * 2,
    y: rect.y,
    width: rect.w + HATCH_PERIOD * 4,
    height: rect.h,
  }

  return (
    <>
      <clipPath id={clipId}>
        <rect
          x={rect.x + pad}
          y={rect.y + pad}
          width={rect.w - pad * 2}
          height={rect.h - pad * 2}
          rx={Math.max(2, rx - pad)}
        />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>
        <motion.g style={{ x }}>
          <rect {...sheet} fill={`url(#bypass-hatch-${layout.id})`} />
          <motion.rect
            {...sheet}
            fill={`url(#bypass-hatch-lit-${layout.id})`}
            style={{ opacity: level }}
          />
        </motion.g>
      </g>
    </>
  )
}

/** Рамка узла с подсветкой: в покое тусклая, при прохождении импульса светлеет. */
function Frame({
  rect,
  rx,
  fill,
  level,
  hatch,
  children,
}: {
  rect: Rect
  rx: number
  fill: string
  level: MotionValue<number>
  hatch?: string
  children?: ReactNode
}) {
  const shape = { x: rect.x, y: rect.y, width: rect.w, height: rect.h, rx }
  return (
    <g>
      <rect {...shape} fill={fill} stroke="white" strokeOpacity="0.14" />
      {hatch ? <Hatch name={hatch} rect={rect} rx={rx} level={level} /> : null}
      <motion.rect
        {...shape}
        fill="white"
        fillOpacity="0.035"
        stroke="white"
        strokeOpacity="0.62"
        style={{ opacity: level }}
      />
      {children}
    </g>
  )
}

function Labels({
  rect,
  type,
  level,
  caption,
  main,
  inline,
}: {
  rect: Rect
  type: TextStyle
  level: MotionValue<number>
  caption: string
  main?: string
  inline?: boolean
}) {
  const centerY = rect.y + rect.h / 2
  return (
    <>
      <LitText
        level={level}
        from={112}
        to={176}
        x={inline ? rect.x + rect.w - type.padX : rect.x + type.padX}
        y={inline ? centerY + type.cap * 0.36 : rect.y + type.capDy}
        fontSize={type.cap}
        letterSpacing={type.cap * 0.09}
        textAnchor={inline ? 'end' : undefined}
      >
        {caption}
      </LitText>
      {main ? (
        <LitText
          level={level}
          from={161}
          to={245}
          x={rect.x + type.padX}
          y={inline ? centerY + type.main * 0.36 : rect.y + type.mainDy}
          fontSize={type.main}
          letterSpacing={type.main * 0.07}
        >
          {main}
        </LitText>
      ) : null}
    </>
  )
}

function Endpoint({
  rect,
  level,
  copy,
  hatch,
  dot,
}: {
  rect: Rect
  level: (t: number) => number
  copy: [string, string]
  hatch?: string
  dot?: boolean
}) {
  const { layout } = useTimeline()
  const lit = useLevel(level)
  const dotOpacity = useTransform(lit, (value) => 0.28 + 0.72 * value)
  const glowOpacity = useTransform(lit, (value) => value * GLOW_OPACITY)
  const dotShape = {
    cx: rect.x + rect.w - layout.box.padX - 2,
    cy: rect.y + layout.box.capDy - layout.box.cap * 0.36,
    r: layout.inlineCells ? 3.5 : 4.5,
    fill: '#f5f5f5',
  }
  return (
    <Frame rect={rect} rx={layout.radius.box} fill="#090909" level={lit} hatch={hatch}>
      <Labels rect={rect} type={layout.box} level={lit} caption={copy[0]} main={copy[1]} />
      {dot ? (
        <>
          <motion.circle
            {...dotShape}
            filter={`url(#bypass-glow-${layout.id})`}
            style={{ opacity: glowOpacity }}
          />
          <motion.circle {...dotShape} style={{ opacity: dotOpacity }} />
        </>
      ) : null}
    </Frame>
  )
}

function Cell({
  rect,
  level,
  copy,
  hatch,
  inline,
}: {
  rect: Rect
  level: (t: number) => number
  copy: [string, string]
  hatch?: string
  inline?: boolean
}) {
  const { layout } = useTimeline()
  const lit = useLevel(level)
  return (
    <Frame rect={rect} rx={layout.radius.cell} fill="#0d0d0d" level={lit} hatch={hatch}>
      <Labels
        rect={rect}
        type={layout.cell}
        level={lit}
        caption={copy[0]}
        main={copy[1]}
        inline={inline}
      />
    </Frame>
  )
}

/** Проверка доказательства: знак Spatium загорается только для клиента. */
function VerifyCell() {
  const { layout } = useTimeline()
  const rect = layout.cells.verify
  const lit = useLevel(levels.verify)
  const verified = useLevel(levels.mark)
  const glowOpacity = useTransform(verified, (value) => value * GLOW_OPACITY)
  const type = layout.cell
  // На десктопе подпись и знак — одна группа, отцентрированная в ячейке по обеим осям.
  const capHeight = type.cap * 0.72
  const gap = layout.inlineCells ? 5 : 9
  const stackTop = rect.y + (rect.h - (capHeight + gap + layout.mark.h)) / 2
  const centerX = rect.x + rect.w / 2
  const mark = {
    href: '/spatium-mark.svg',
    x: layout.inlineCells
      ? rect.x + rect.w - type.padX - layout.mark.w
      : centerX - layout.mark.w / 2,
    y: layout.inlineCells
      ? rect.y + (rect.h - layout.mark.h) / 2
      : stackTop + capHeight + gap,
    width: layout.mark.w,
    height: layout.mark.h,
  }

  return (
    <Frame rect={rect} rx={layout.radius.cell} fill="#0d0d0d" level={lit}>
      {layout.inlineCells ? (
        <Labels
          rect={rect}
          type={{ ...type, cap: type.main }}
          level={lit}
          caption=""
          main={layout.copy.verify}
          inline
        />
      ) : (
        <LitText
          level={lit}
          from={112}
          to={176}
          x={centerX}
          // letter-spacing добавляет хвост после последней буквы — компенсируем половину.
          dx={(type.cap * 0.09) / 2}
          y={stackTop + capHeight}
          fontSize={type.cap}
          letterSpacing={type.cap * 0.09}
          textAnchor="middle"
        >
          {layout.copy.verify}
        </LitText>
      )}
      <image {...mark} filter={`url(#bypass-mark-dim-${layout.id})`} />
      <motion.image
        {...mark}
        filter={`url(#bypass-glow-${layout.id})`}
        style={{ opacity: glowOpacity }}
      />
      <motion.image {...mark} style={{ opacity: verified }} />
    </Frame>
  )
}

function Diagram() {
  const { layout } = useTimeline()
  const { copy, cells, header } = layout
  const serverLevel = useLevel(() => 0)

  return (
    <svg
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      className={layout.className}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <pattern
          id={`bypass-dots-${layout.id}`}
          width="20"
          height="20"
          patternUnits="userSpaceOnUse"
          patternTransform="translate(10 15)"
        >
          <circle cx="1" cy="1" r="0.8" fill="white" fillOpacity="0.07" />
        </pattern>
        {[
          ['', 0.07],
          ['-lit', 0.16],
        ].map(([suffix, opacity]) => (
          <pattern
            key={suffix}
            id={`bypass-hatch${suffix}-${layout.id}`}
            width={HATCH_PERIOD}
            height={HATCH_PERIOD}
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M-1 1L1 -1M0 11L11 0M10 12L12 10"
              stroke="#f5f5f5"
              strokeOpacity={opacity}
              strokeWidth="0.75"
            />
          </pattern>
        ))}
        <filter id={`bypass-mark-dim-${layout.id}`} colorInterpolationFilters="sRGB">
          <feColorMatrix
            type="matrix"
            values="0 0 0 0.4 0
                    0 0 0 0.4 0
                    0 0 0 0.4 0
                    0 0 0 1 0"
          />
        </filter>
        {/* Мягкое свечение: размытая копия под точкой или знаком. */}
        <filter id={`bypass-glow-${layout.id}`} x="-150%" y="-150%" width="400%" height="400%">
          <feGaussianBlur stdDeviation={layout.inlineCells ? 2.5 : 3.5} />
        </filter>
      </defs>

      <rect width={layout.width} height={layout.height} fill={`url(#bypass-dots-${layout.id})`} />

      <g style={{ fontFamily: 'var(--font-mono)' }}>
        <g fill="#8a8a8a" fontSize={header.font} letterSpacing={header.spacing}>
          <text x={layout.left} y={header.y}>
            {header.text[0]}
          </text>
          {header.text[1] ? (
            <text x={layout.right} y={header.y} textAnchor="end">
              {header.text[1]}
            </text>
          ) : null}
        </g>

        {layout.tag ? (
          <text
            x={layout.tag.x}
            y={layout.tag.y}
            fill="#626262"
            fontSize={layout.tag.font}
            letterSpacing={layout.tag.font * 0.1}
          >
            {layout.tag.text}
          </text>
        ) : null}

        <Frame rect={layout.server} rx={layout.radius.server} fill="#070707" level={serverLevel} />

        <g fill="none" stroke="#f5f5f5" strokeLinecap="round" strokeLinejoin="round">
          <path d={layout.routes[0]} strokeOpacity="0.2" />
          <path d={layout.routes[1]} strokeOpacity="0.2" />
        </g>
        <Stream route={layout.routes[1]} />
        <Pulse route={layout.routes[0]} startAt={PROBE_AT} />
        <Pulse route={layout.routes[1]} startAt={CLIENT_AT} />

        <Cell
          rect={cells.handshake}
          level={levels.handshake}
          copy={copy.handshake}
          inline={layout.inlineCells}
        />
        <VerifyCell />
        <Cell rect={cells.web} level={levels.web} copy={copy.web} />
        <Cell rect={cells.tunnel} level={levels.tunnel} copy={copy.tunnel} hatch="tunnel" />

        <Endpoint rect={layout.sources[0]} level={levels.probe} copy={copy.sources[0]} dot />
        <Endpoint rect={layout.sources[1]} level={levels.client} copy={copy.sources[1]} dot />
        <Endpoint rect={layout.outputs[0]} level={levels.site} copy={copy.outputs[0]} />
        <Endpoint
          rect={layout.outputs[1]}
          level={levels.proxy}
          copy={copy.outputs[1]}
          hatch="proxy"
        />

        {layout.caption ? (
          <text
            x={layout.left}
            y={layout.caption.y}
            fill="#7a7a7a"
            fontSize={layout.caption.font}
            fontFamily="var(--font-sans)"
          >
            {layout.caption.text}
          </text>
        ) : null}
      </g>
    </svg>
  )
}

export function BypassDiagram({ active, reducedMotion }: BypassDiagramProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const visible = useInView(rootRef, { amount: 0.15 })
  const time = useMotionValue(reducedMotion ? STATIC : 0)
  const startedRef = useRef(false)
  // В DOM живёт только макет текущего брейкпоинта. Раньше монтировались оба,
  // и скрытый через display: none всё равно каждый кадр пересчитывал свои
  // motion values и писал стили — вдвое больше работы на анимацию схемы.
  const layout = useMediaQuery(DESKTOP_QUERY) ? desktopLayout : mobileLayout

  useEffect(() => {
    if (reducedMotion) {
      time.set(STATIC)
      return
    }
    // Вне экрана цикл останавливается; при возврате оба прогона играют с начала.
    time.set(0)
    if (!active || !visible) return

    const controls = animate(time, [0, CYCLE], {
      duration: CYCLE,
      ease: 'linear',
      repeat: Infinity,
      delay: startedRef.current ? 0.2 : FIRST_START_DELAY,
    })
    startedRef.current = true
    return () => controls.stop()
  }, [active, visible, reducedMotion, time])

  return (
    <motion.div
      ref={rootRef}
      className="absolute inset-0"
      initial={reducedMotion ? false : { opacity: 0 }}
      animate={reducedMotion || active ? { opacity: 1 } : { opacity: 0 }}
      transition={reducedMotion ? { duration: 0 } : diagramTransition}
    >
      <TimelineContext.Provider key={layout.id} value={{ time, layout }}>
        <Diagram />
      </TimelineContext.Provider>
    </motion.div>
  )
}
