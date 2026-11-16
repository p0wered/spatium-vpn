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

interface PrivacyDiagramProps {
  active: boolean
  reducedMotion: boolean
}

const diagramTransition = {
  duration: 0.76,
  delay: 0.72,
  ease: [0.22, 1, 0.36, 1] as const,
}

/**
 * Сюжет диаграммы — одна сессия, проигранная по оси времени: плейхед идёт от
 * CONNECT к DISCONNECT и «записывает» телеметрию, на DISCONNECT память
 * схлопывается в ноль, затем вся запись гаснет и цикл начинается заново.
 *
 * Всё выводится из одного motion value `time` (секунды внутри цикла).
 * STATIC — кадр без анимации (reduced motion): прежняя статичная картинка.
 */
const STATIC = -1
const FADE_IN = 0.3
const SWEEP = 3.4
const SWEEP_END = FADE_IN + SWEEP
const FADE_OUT_AT = 5.5
const FADE_OUT = 0.45
const CYCLE = 6.2
const FIRST_START_DELAY = 0.95

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))
const easeOut = (value: number) => 1 - Math.pow(1 - clamp01(value), 3)
const gray = (level: number) => {
  const v = Math.round(level)
  return `rgb(${v} ${v} ${v})`
}

interface Geometry {
  id: string
  /** Начало и конец шкалы времени. */
  x0: number
  x1: number
  xConnect: number
  xDisconnect: number
  railY: number
  /** Базовая линия памяти — нижняя точка плейхеда. */
  floorY: number
  height: number
  /** Линии, на которых плейхед что-то записывает. */
  lanes: number[]
  /** Линии «мимо туннеля»: на них плейхед всегда пуст. */
  hollow: number[]
}

interface Timeline {
  time: MotionValue<number>
  geo: Geometry
  /** Момент, когда плейхед доходит до координаты x. */
  at: (x: number) => number
}

const TimelineContext = createContext<Timeline | null>(null)

function useTimeline() {
  const timeline = useContext(TimelineContext)
  if (!timeline) throw new Error('PrivacyDiagram timeline is missing')
  return timeline
}

function TimelineProvider({
  time,
  geo,
  children,
}: {
  time: MotionValue<number>
  geo: Geometry
  children: ReactNode
}) {
  const at = (x: number) => FADE_IN + ((x - geo.x0) / (geo.x1 - geo.x0)) * SWEEP
  return <TimelineContext.Provider value={{ time, geo, at }}>{children}</TimelineContext.Provider>
}

/** 0 → 1, когда плейхед проходит x. */
function usePassed(x: number, duration = 0.3) {
  const { time, at } = useTimeline()
  const start = at(x)
  return useTransform(time, (t) => (t === STATIC ? 1 : easeOut((t - start) / duration)))
}

/** 1 → 0 на DISCONNECT: память освобождается. */
function useRelease() {
  const { time, at, geo } = useTimeline()
  const start = at(geo.xDisconnect)
  return useTransform(time, (t) => (t === STATIC ? 1 : 1 - easeOut((t - start) / 0.42)))
}

/** Всё записанное за сессию: гаснет в конце цикла. */
function Recording({ children }: { children: ReactNode }) {
  const { time } = useTimeline()
  const opacity = useTransform(time, (t) =>
    t === STATIC ? 1 : 1 - clamp01((t - FADE_OUT_AT) / FADE_OUT),
  )
  return <motion.g style={{ opacity }}>{children}</motion.g>
}

/** Клип, открывающий линии и кривые ровно до плейхеда. */
function RevealClip() {
  const { time, geo } = useTimeline()
  const width = useTransform(time, (t) =>
    t === STATIC ? geo.x1 - geo.x0 + 4 : clamp01((t - FADE_IN) / SWEEP) * (geo.x1 - geo.x0) + 2,
  )
  return (
    <clipPath id={`privacy-reveal-${geo.id}`}>
      <motion.rect x={geo.x0 - 2} y={0} width={width} height={geo.height} />
    </clipPath>
  )
}

function Revealed({ children }: { children: ReactNode }) {
  const { geo } = useTimeline()
  return <g clipPath={`url(#privacy-reveal-${geo.id})`}>{children}</g>
}

function Bar({
  x,
  y,
  width,
  height,
  opacity,
  grow,
}: {
  x: number
  y: number
  width: number
  height: number
  opacity: number
  grow: 'up' | 'down'
}) {
  const scaleY = usePassed(x, 0.26)
  return (
    <motion.rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill="white"
      fillOpacity={opacity}
      style={{ scaleY, originY: grow === 'up' ? 1 : 0 }}
    />
  )
}

function Playhead() {
  const { time, geo } = useTimeline()
  const x = useTransform(time, (t) =>
    t === STATIC ? geo.x1 : geo.x0 + clamp01((t - FADE_IN) / SWEEP) * (geo.x1 - geo.x0),
  )
  const opacity = useTransform(time, (t) =>
    t === STATIC ? 0 : Math.min(clamp01(t / FADE_IN), 1 - clamp01((t - SWEEP_END) / 0.3)),
  )
  const trail = geo.id === 'desktop' ? 84 : 52

  return (
    <motion.g style={{ x, opacity }}>
      <rect
        x={-trail}
        y={geo.railY}
        width={trail}
        height={geo.floorY - geo.railY}
        fill={`url(#privacy-trail-${geo.id})`}
      />
      <path
        d={`M0 ${geo.railY}V${geo.floorY}`}
        stroke="white"
        strokeOpacity="0.1"
        strokeWidth="5"
      />
      <path d={`M0 ${geo.railY - 8}V${geo.floorY}`} stroke="white" strokeOpacity="0.62" />
      <rect x="-2.5" y={geo.railY - 2.5} width="5" height="5" fill="#f5f5f5" />
      {geo.lanes.map((y) => (
        <rect key={y} x="-1.5" y={y - 1.5} width="3" height="3" fill="#f5f5f5" />
      ))}
      {geo.hollow.map((y) => (
        <circle
          key={y}
          cx="0"
          cy={y}
          r="2.6"
          fill="#050505"
          stroke="white"
          strokeOpacity="0.7"
          strokeWidth="0.9"
        />
      ))}
    </motion.g>
  )
}

function TrailGradient() {
  const { geo } = useTimeline()
  return (
    <linearGradient id={`privacy-trail-${geo.id}`} x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" stopColor="white" stopOpacity="0" />
      <stop offset="1" stopColor="white" stopOpacity="0.055" />
    </linearGradient>
  )
}

/** Подпись фазы на шкале: загорается, когда плейхед до неё доходит. */
function PhaseLabel({
  x,
  y,
  textAnchor,
  children,
}: {
  x: number
  y: number
  textAnchor?: 'middle' | 'end'
  children: ReactNode
}) {
  const passed = usePassed(x - 4, 0.25)
  const { time } = useTimeline()
  const fill = useTransform(() => {
    if (time.get() === STATIC) return gray(119)
    const fading = 1 - clamp01((time.get() - FADE_OUT_AT) / FADE_OUT)
    return gray(119 + 105 * passed.get() * fading)
  })
  return (
    <motion.text x={x} y={y} textAnchor={textAnchor} style={{ fill }}>
      {children}
    </motion.text>
  )
}

function Memory({ area, line }: { area: string; line: string }) {
  const release = useRelease()
  const flatten = useTransform(release, (value) => Math.max(value, 0.004))
  return (
    <Revealed>
      {/* При scaleY = 0 SVG перестаёт рисовать группу, а нам нужна плоская линия нуля. */}
      <motion.g style={{ scaleY: flatten, originY: 1 }}>
        <motion.path d={area} fill="white" style={{ fillOpacity: 0.075, opacity: release }} />
        <path
          d={line}
          fill="none"
          stroke="white"
          strokeOpacity="0.48"
          strokeWidth="1.1"
          strokeLinecap="square"
          strokeLinejoin="miter"
          vectorEffect="non-scaling-stroke"
        />
      </motion.g>
    </Revealed>
  )
}

const TX = [
  10, 22, 15, 34, 18, 27, 12, 39, 26, 18, 31, 14, 24, 36, 19, 28, 12, 32, 20, 16, 27, 11, 23, 18,
  30, 14, 25, 17,
].map((value) => value / 39)
const RX = [
  8, 14, 20, 12, 26, 17, 9, 24, 15, 28, 16, 11, 22, 18, 30, 13, 20, 15, 25, 10, 19, 14, 21, 9, 17,
  23, 12, 16,
].map((value) => value / 30)
// Ноль — в этот интервал запросов не было.
const DNS = [
  10, 0, 18, 12, 0, 22, 14, 0, 8, 20, 0, 15, 24, 11, 0, 17, 9, 0, 21, 13, 19, 0, 10, 16, 0, 8, 14,
  7,
].map((value) => value / 24)
const MEMORY_WOBBLE = [0, 0.9, 0.2, 1.1]
/**
 * Сессии на общем выходном адресе, в слотах [от, до]. Чужие приходят и уходят
 * независимо от нашей; наша (OWN_SESSION_ROW) длится от CONNECT до DISCONNECT
 * и для сайта неотличима от соседних.
 */
const IP_SESSIONS: [number, number][][] = [
  [
    [-1.5, 6],
    [8, 19],
    [21, 29.5],
  ],
  [[0, 28]],
  [
    [-1.5, 2],
    [4, 13],
    [15, 24],
    [26, 29.5],
  ],
  [
    [1, 9],
    [11, 22],
    [24, 29.5],
  ],
]
const OWN_SESSION_ROW = 1

/** Каждый n-й отсчёт: на мобильной сетке слотов вдвое меньше. */
const sample = (values: number[], slots: number) => {
  const step = values.length / slots
  return Array.from({ length: slots }, (_, index) => values[Math.round(index * step)])
}

const BAR_WIDTH = 6

function memoryPath(layout: Layout, closed: boolean) {
  const { geo, slots, pitch, tracks, memory } = layout
  const base = tracks[3] + memory.base
  const span = memory.base - memory.top
  const points = Array.from({ length: slots }, (_, index) => {
    const slot = index + 1
    const level = Math.min(1, (slot + MEMORY_WOBBLE[slot % 4]) / (slots + 1))
    return `L${geo.xConnect + slot * pitch} ${(base - level * span).toFixed(1)}`
  }).join('')
  return `M${geo.x0} ${base}H${geo.xConnect}${points}V${base}H${geo.x1}${closed ? 'Z' : ''}`
}

interface Layout {
  geo: Geometry
  className: string
  width: number
  left: number
  right: number
  slots: number
  pitch: number
  headerY: number
  phaseY: number
  /** Верхние границы четырёх дорожек. */
  tracks: number[]
  trackHeight: number
  /**
   * Смещения внутри дорожки. Заголовок и подписи линий стоят с равным шагом,
   * а отступ до верхней и нижней границы дорожки одинаковый.
   */
  titleDy: number
  laneA: number
  laneB: number
  traffic: { center: number; tx: number; rx: number }
  dnsMax: number
  ip: { rows: number; height: number; gap: number }
  memory: { top: number; base: number }
  font: { header: number; title: number; lane: number; caption: number }
  spacing: { header: number; title: number; lane: number }
  copy: {
    header: [string, string]
    phases: [string, string, string]
    titles: [string, string, string, string]
    lanes: { ip: [string, string]; dns: [string, string]; memory: string }
    caption: string[]
  }
  captionY: number
  captionLine: number
}

const desktopTracks = [118, 218, 318, 418]
const desktopLayout: Layout = {
  geo: {
    id: 'desktop',
    x0: 176,
    x1: 672,
    xConnect: 200,
    xDisconnect: 648,
    railY: 92,
    floorY: 518,
    height: 576,
    lanes: [
      desktopTracks[0] + 65,
      desktopTracks[1] + 50,
      desktopTracks[2] + 50,
      desktopTracks[3] + 79,
    ],
    hollow: [desktopTracks[1] + 79, desktopTracks[2] + 79],
  },
  className: 'hidden h-full w-full lg:block',
  width: 696,
  left: 24,
  right: 672,
  slots: 28,
  pitch: 16,
  headerY: 36,
  phaseY: 78,
  tracks: desktopTracks,
  trackHeight: 100,
  titleDy: 24,
  laneA: 50,
  laneB: 79,
  traffic: { center: 65, tx: 24, rx: 16 },
  dnsMax: 17,
  ip: { rows: 4, height: 3, gap: 2 },
  memory: { top: 38, base: 79 },
  font: { header: 9, title: 9, lane: 8, caption: 11 },
  spacing: { header: 1.35, title: 1, lane: 0.72 },
  copy: {
    header: ['SESSION PRIVACY TELEMETRY', 'TRAFFIC / DNS / MEMORY'],
    phases: ['CONNECT', 'LIVE SESSION', 'DISCONNECT'],
    titles: ['ENCRYPTED TRAFFIC', 'SITE SOURCE', 'DNS ROUTE', 'SESSION MEMORY'],
    lanes: { ip: ['SHARED IP', 'REAL IP'], dns: ['VPN TUNNEL', 'OUTSIDE VPN'], memory: 'RAM ONLY' },
    caption: ['A shared identity leaves the tunnel while DNS stays inside and memory is released.'],
  },
  captionY: 546,
  captionLine: 0,
}

const mobileTracks = [88, 162, 236, 310]
const mobileLayout: Layout = {
  geo: {
    id: 'mobile',
    x0: 94,
    x1: 342,
    xConnect: 106,
    xDisconnect: 330,
    railY: 70,
    floorY: 384,
    height: 430,
    lanes: [mobileTracks[0] + 48, mobileTracks[1] + 38, mobileTracks[2] + 38, mobileTracks[3] + 59],
    hollow: [mobileTracks[1] + 59, mobileTracks[2] + 59],
  },
  className: 'h-full w-full lg:hidden',
  width: 360,
  left: 18,
  right: 342,
  slots: 14,
  pitch: 16,
  headerY: 28,
  phaseY: 58,
  tracks: mobileTracks,
  trackHeight: 74,
  titleDy: 19,
  laneA: 38,
  laneB: 59,
  traffic: { center: 48, tx: 15, rx: 12 },
  dnsMax: 12,
  ip: { rows: 3, height: 2, gap: 2 },
  memory: { top: 30, base: 59 },
  font: { header: 8, title: 8, lane: 7, caption: 8.5 },
  spacing: { header: 1.05, title: 0.85, lane: 0.58 },
  copy: {
    header: ['SESSION PRIVACY', 'LIVE ROUTE'],
    phases: ['CONNECT', 'LIVE', 'OFF'],
    titles: ['ENCRYPTED TRAFFIC', 'SITE SOURCE', 'DNS ROUTE', 'SESSION MEMORY'],
    lanes: { ip: ['SHARED IP', 'REAL IP'], dns: ['TUNNEL', 'OUTSIDE'], memory: 'RAM ONLY' },
    caption: ['A shared identity leaves the tunnel.', 'DNS stays inside; memory is released.'],
  },
  captionY: 404,
  captionLine: 12,
}

const LANE_STROKE = { stroke: 'white', strokeOpacity: 0.1 }
const EMPTY_LANE_STROKE = { stroke: 'white', strokeOpacity: 0.15, strokeDasharray: '2 6' }

function Diagram({ layout }: { layout: Layout }) {
  const { geo, copy, font, spacing, tracks, left, right } = layout
  const slotX = (index: number) =>
    geo.xConnect + index * layout.pitch + (layout.pitch - BAR_WIDTH) / 2
  // Координата в слотах полной (28) сетки — на мобильной слоты вдвое шире.
  const slotEdge = (slot: number) => geo.xConnect + slot * layout.pitch * (layout.slots / 28)
  const lane = (y: number, props: object) => <path d={`M${geo.x0} ${y}H${geo.x1}`} {...props} />
  const laneLabel = (y: number, label: string) => (
    <text x={left} y={y + font.lane * 0.36}>
      {label}
    </text>
  )
  const [traffic, site, dns, memory] = tracks
  const trafficY = traffic + layout.traffic.center
  const tx = sample(TX, layout.slots)
  const rx = sample(RX, layout.slots)
  const dnsBars = sample(DNS, layout.slots)

  return (
    <svg
      viewBox={`0 0 ${layout.width} ${geo.height}`}
      className={layout.className}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        {/* Точки фона стоят на той же сетке, что и столбцы. */}
        <pattern
          id={`privacy-dots-${geo.id}`}
          width={layout.pitch}
          height={layout.pitch}
          patternUnits="userSpaceOnUse"
          patternTransform={`translate(${(geo.xConnect % layout.pitch) - 1} ${(tracks[0] % layout.pitch) - 1})`}
        >
          <circle cx="1" cy="1" r="0.65" fill="white" fillOpacity="0.05" />
        </pattern>
        <TrailGradient />
        <RevealClip />
      </defs>

      <rect width={layout.width} height={geo.height} fill={`url(#privacy-dots-${geo.id})`} />

      <g style={{ fontFamily: 'var(--font-mono)' }}>
        <g fill="#777777" fontSize={font.header} fontWeight="520" letterSpacing={spacing.header}>
          <text x={left} y={layout.headerY}>
            {copy.header[0]}
          </text>
          <text x={right} y={layout.headerY} textAnchor="end">
            {copy.header[1]}
          </text>
        </g>

        {/* Шкала времени */}
        <path d={`M${geo.x0} ${geo.railY}H${geo.x1}`} stroke="white" strokeOpacity="0.16" />
        <path
          d={[geo.xConnect, (geo.xConnect + geo.xDisconnect) / 2, geo.xDisconnect]
            .map((x) => `M${x} ${geo.railY - 5}V${geo.railY + 5}`)
            .join('')}
          stroke="white"
          strokeOpacity="0.16"
        />
        <g fontSize={font.title} fontWeight="520" letterSpacing={spacing.header}>
          <PhaseLabel x={geo.xConnect} y={layout.phaseY}>
            {copy.phases[0]}
          </PhaseLabel>
          <PhaseLabel
            x={(geo.xConnect + geo.xDisconnect) / 2}
            y={layout.phaseY}
            textAnchor="middle"
          >
            {copy.phases[1]}
          </PhaseLabel>
          <PhaseLabel x={geo.xDisconnect} y={layout.phaseY} textAnchor="end">
            {copy.phases[2]}
          </PhaseLabel>
        </g>

        {/* Границы дорожек */}
        <path
          d={[...tracks, geo.floorY].map((y) => `M${left} ${y}H${right}`).join('')}
          stroke="white"
          strokeOpacity="0.07"
        />

        <g fill="#8a8a8a" fontSize={font.title} fontWeight="500" letterSpacing={spacing.title}>
          {tracks.map((y, index) => (
            <text key={y} x={left} y={y + layout.titleDy}>
              {copy.titles[index]}
            </text>
          ))}
        </g>

        <g fill="#5c5c5c" fontSize={font.lane} fontWeight="470" letterSpacing={spacing.lane}>
          {laneLabel(traffic + layout.laneA, 'TX')}
          {laneLabel(traffic + layout.laneB, 'RX')}
          {laneLabel(site + layout.laneA, copy.lanes.ip[0])}
          {laneLabel(site + layout.laneB, copy.lanes.ip[1])}
          {laneLabel(dns + layout.laneA, copy.lanes.dns[0])}
          {laneLabel(dns + layout.laneB, copy.lanes.dns[1])}
          {laneLabel(memory + layout.memory.base, copy.lanes.memory)}
        </g>

        {lane(trafficY, LANE_STROKE)}
        {lane(site + layout.laneA, LANE_STROKE)}
        {lane(site + layout.laneB, EMPTY_LANE_STROKE)}
        {lane(dns + layout.laneA, LANE_STROKE)}
        {lane(dns + layout.laneB, EMPTY_LANE_STROKE)}
        {lane(memory + layout.memory.base, LANE_STROKE)}

        <Recording>
          {tx.map((value, index) => (
            <g key={index}>
              <Bar
                x={slotX(index)}
                y={trafficY - 1 - value * layout.traffic.tx}
                width={BAR_WIDTH}
                height={value * layout.traffic.tx}
                opacity={0.5}
                grow="up"
              />
              <Bar
                x={slotX(index)}
                y={trafficY + 1}
                width={BAR_WIDTH}
                height={rx[index] * layout.traffic.rx}
                opacity={0.22}
                grow="down"
              />
            </g>
          ))}

          <Revealed>
            {IP_SESSIONS.slice(0, layout.ip.rows).map((row, rowIndex) =>
              row.map(([from, to]) => (
                <rect
                  key={`${rowIndex}-${from}`}
                  x={slotEdge(from)}
                  y={
                    site +
                    layout.laneA -
                    (layout.ip.rows - rowIndex) * (layout.ip.height + layout.ip.gap) +
                    layout.ip.gap
                  }
                  width={slotEdge(to) - slotEdge(from)}
                  height={layout.ip.height}
                  fill="white"
                  fillOpacity={rowIndex === OWN_SESSION_ROW ? 0.6 : 0.2}
                />
              )),
            )}
          </Revealed>

          {dnsBars.map((value, index) =>
            value === 0 ? null : (
              <Bar
                key={index}
                x={slotX(index)}
                y={dns + layout.laneA - value * layout.dnsMax}
                width={BAR_WIDTH}
                height={value * layout.dnsMax}
                opacity={0.38}
                grow="up"
              />
            ),
          )}

          <Memory area={memoryPath(layout, true)} line={memoryPath(layout, false)} />
        </Recording>

        <Playhead />

        {copy.caption.map((line, index) => (
          <text
            key={line}
            x={left}
            y={layout.captionY + index * layout.captionLine}
            fill="#8f8f8f"
            fontSize={font.caption}
            fontWeight="390"
            fontFamily="var(--font-sans)"
          >
            {line}
          </text>
        ))}
      </g>
    </svg>
  )
}

export function PrivacyDiagram({ active, reducedMotion }: PrivacyDiagramProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const visible = useInView(rootRef, { amount: 0.15 })
  const time = useMotionValue(reducedMotion ? STATIC : 0)
  const startedRef = useRef(false)
  // В DOM живёт только макет текущего брейкпоинта: скрытый через display: none
  // иначе каждый кадр пересчитывал бы свои motion values впустую.
  const layout = useMediaQuery(DESKTOP_QUERY) ? desktopLayout : mobileLayout

  useEffect(() => {
    if (reducedMotion) {
      time.set(STATIC)
      return
    }
    // Вне экрана цикл останавливается; при возврате сессия играет с начала.
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
      className="privacy-diagram-fade absolute inset-0"
      initial={reducedMotion ? false : { opacity: 0 }}
      animate={reducedMotion || active ? { opacity: 1 } : { opacity: 0 }}
      transition={reducedMotion ? { duration: 0 } : diagramTransition}
    >
      <TimelineProvider key={layout.geo.id} time={time} geo={layout.geo}>
        <Diagram layout={layout} />
      </TimelineProvider>
    </motion.div>
  )
}
