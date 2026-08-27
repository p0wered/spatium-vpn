import { useEffect, useRef, useState, type PointerEvent } from 'react'
import type { TrafficDay } from '../../data/mock'
import { formatDate, formatGB } from '../../lib/format'

/**
 * Кастомный SVG-график трафика (Recharts отброшен).
 * Плавная линия (catmull-rom → bezier) + градиентная заливка, hover —
 * вертикальная направляющая с точкой и glass-tooltip. Ширина меряется
 * ResizeObserver'ом: viewBox-растяжение искажало бы штрих и точки.
 */

const H = 240
const PAD = { top: 16, right: 8, bottom: 28, left: 8 }

/** Округление потолка оси до «красивого» значения */
function niceMax(v: number) {
  const steps = [2, 4, 6, 8, 10, 12, 16, 20]
  return steps.find((s) => s >= v) ?? Math.ceil(v / 10) * 10
}

function smoothPath(pts: { x: number; y: number }[]) {
  if (pts.length < 2) return ''
  let d = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(pts.length - 1, i + 2)]
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`
  }
  return d
}

export function TrafficChart({ days }: { days: TrafficDay[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [hover, setHover] = useState<number | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const n = days.length
  const max = niceMax(Math.max(...days.map((d) => d.gb)))
  const innerW = width - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom
  const px = (i: number) => PAD.left + (n === 1 ? innerW / 2 : (i * innerW) / (n - 1))
  const py = (gb: number) => PAD.top + (1 - gb / max) * innerH

  const pts = days.map((d, i) => ({ x: px(i), y: py(d.gb) }))
  const line = smoothPath(pts)
  const area = `${line} L ${px(n - 1)} ${PAD.top + innerH} L ${px(0)} ${PAD.top + innerH} Z`

  // Подписи X: для 7 дней — каждый второй, для 30 — каждый седьмой
  const labelEvery = n <= 7 ? 2 : 7
  const gridValues = [max / 2, max]

  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const i = Math.round(((x - PAD.left) / innerW) * (n - 1))
    setHover(Math.min(n - 1, Math.max(0, i)))
  }

  const hovered = hover !== null ? days[hover] : null

  return (
    <div ref={containerRef} className="relative">
      {width > 0 && (
        <svg
          width={width}
          height={H}
          onPointerMove={onPointerMove}
          onPointerLeave={() => setHover(null)}
          className="block touch-none select-none"
        >
          <defs>
            {/* Заливка «цвет живёт в свете»: белое ядро у линии → ледяной спад */}
            <linearGradient id="traffic-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="white" stopOpacity="0.14" />
              <stop offset="45%" stopColor="var(--color-ice)" stopOpacity="0.17" />
              <stop offset="100%" stopColor="var(--color-ice)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {gridValues.map((v) => (
            <g key={v}>
              <line
                x1={PAD.left}
                x2={width - PAD.right}
                y1={py(v)}
                y2={py(v)}
                stroke="white"
                strokeOpacity="0.07"
                strokeDasharray="3 5"
              />
              <text
                x={PAD.left}
                y={py(v) - 6}
                fill="var(--color-fg-muted)"
                fillOpacity="0.7"
                fontSize="10"
                fontFamily="var(--font-mono)"
              >
                {v} GB
              </text>
            </g>
          ))}

          <path d={area} fill="url(#traffic-fill)" />
          <path
            d={line}
            fill="none"
            stroke="white"
            strokeOpacity="0.9"
            strokeWidth="1.5"
            style={{ filter: 'drop-shadow(0 0 6px rgb(180 210 255 / 0.75))' }}
          />

          {days.map((d, i) =>
            i % labelEvery === 0 ? (
              <text
                key={i}
                x={px(i)}
                y={H - 8}
                fill="var(--color-fg-muted)"
                fillOpacity="0.7"
                fontSize="10"
                fontFamily="var(--font-mono)"
                textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}
              >
                {formatDate(d.date)}
              </text>
            ) : null,
          )}

          {hover !== null && (
            <g>
              <line
                x1={px(hover)}
                x2={px(hover)}
                y1={PAD.top}
                y2={PAD.top + innerH}
                stroke="white"
                strokeOpacity="0.15"
              />
              <circle
                cx={px(hover)}
                cy={py(days[hover].gb)}
                r="3.5"
                fill="white"
                style={{ filter: 'drop-shadow(0 0 6px rgb(180 210 255 / 0.7))' }}
              />
            </g>
          )}
        </svg>
      )}

      {hovered && hover !== null && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-xl border border-white/10 bg-surface-2/90 px-3 py-2 text-center backdrop-blur-xl"
          style={{
            left: Math.min(Math.max(px(hover), 52), width - 52),
            top: py(hovered.gb) - 62,
          }}
        >
          <div className="font-mono text-sm">{formatGB(hovered.gb)}</div>
          <div className="text-xs whitespace-nowrap text-fg-muted">{formatDate(hovered.date)}</div>
        </div>
      )}
    </div>
  )
}
