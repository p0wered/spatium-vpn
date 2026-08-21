import { memo, useEffect, useId, useRef, type HTMLAttributes } from 'react'
import { startRenderLoop } from './loop'

const TWO_PI = Math.PI * 2

interface Dot {
  ax: number
  ay: number
  sx: number
  sy: number
  vx: number
  vy: number
  x: number
  y: number
}

interface DotFieldProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  dotRadius?: number
  dotSpacing?: number
  cursorRadius?: number
  cursorForce?: number
  bulgeOnly?: boolean
  bulgeStrength?: number
  glowRadius?: number
  sparkle?: boolean
  waveAmplitude?: number
  gradientFrom?: string
  gradientTo?: string
  glowColor?: string
}

/**
 * Адаптация refs/react-bits-bg/DotField.tsx для фонового слоя Hero.
 * Цикл останавливается вне вьюпорта и учитывает prefers-reduced-motion.
 */
const DotField = memo(function DotField({
  dotRadius = 1.5,
  dotSpacing = 14,
  cursorRadius = 500,
  cursorForce = 0.1,
  bulgeOnly = true,
  bulgeStrength = 67,
  glowRadius = 160,
  sparkle = false,
  waveAmplitude = 0,
  gradientFrom = 'rgba(168, 85, 247, 0.35)',
  gradientTo = 'rgba(180, 151, 207, 0.25)',
  glowColor = '#120f17',
  className = '',
  ...rest
}: DotFieldProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const glowRef = useRef<SVGCircleElement>(null)
  const dotsRef = useRef<Dot[]>([])
  const mouseRef = useRef({ x: -9999, y: -9999, prevX: -9999, prevY: -9999, speed: 0 })
  const sizeRef = useRef({ w: 0, h: 0, offsetX: 0, offsetY: 0 })
  const glowOpacity = useRef(0)
  const engagement = useRef(0)
  const glowId = `dot-field-glow-${useId().replaceAll(':', '')}`

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    const glow = glowRef.current
    if (!container || !canvas) return

    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let resizeTimer: ReturnType<typeof setTimeout>
    let frameCount = 0

    const buildDots = (w: number, h: number) => {
      const step = dotRadius + dotSpacing
      const cols = Math.floor(w / step)
      const rows = Math.floor(h / step)
      const padX = (w % step) / 2
      const padY = (h % step) / 2
      const dots: Dot[] = new Array(rows * cols)
      let index = 0

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const ax = padX + col * step + step / 2
          const ay = padY + row * step + step / 2
          dots[index++] = { ax, ay, sx: ax, sy: ay, vx: 0, vy: 0, x: ax, y: ay }
        }
      }

      dotsRef.current = dots
    }

    const resize = () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        const rect = container.getBoundingClientRect()
        const w = rect.width
        const h = rect.height

        canvas.width = w * dpr
        canvas.height = h * dpr
        canvas.style.width = `${w}px`
        canvas.style.height = `${h}px`
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

        sizeRef.current = {
          w,
          h,
          offsetX: rect.left + window.scrollX,
          offsetY: rect.top + window.scrollY,
        }
        buildDots(w, h)
      }, 100)
    }

    const onPointerMove = (event: PointerEvent) => {
      const size = sizeRef.current
      mouseRef.current.x = event.pageX - size.offsetX
      mouseRef.current.y = event.pageY - size.offsetY
    }

    const updateMouseSpeed = () => {
      const mouse = mouseRef.current
      const dx = mouse.prevX - mouse.x
      const dy = mouse.prevY - mouse.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      mouse.speed += (distance - mouse.speed) * 0.5
      if (mouse.speed < 0.001) mouse.speed = 0
      mouse.prevX = mouse.x
      mouse.prevY = mouse.y
    }

    const render = () => {
      frameCount++
      const dots = dotsRef.current
      const mouse = mouseRef.current
      const { w, h } = sizeRef.current
      const time = frameCount * 0.02

      const targetEngagement = Math.min(mouse.speed / 5, 1)
      engagement.current += (targetEngagement - engagement.current) * 0.06
      if (engagement.current < 0.001) engagement.current = 0
      const engaged = engagement.current

      glowOpacity.current += (engaged - glowOpacity.current) * 0.08
      if (glow) {
        glow.setAttribute('cx', String(mouse.x))
        glow.setAttribute('cy', String(mouse.y))
        glow.style.opacity = String(glowOpacity.current)
      }

      ctx.clearRect(0, 0, w, h)
      const gradient = ctx.createLinearGradient(0, 0, w, h)
      gradient.addColorStop(0, gradientFrom)
      gradient.addColorStop(1, gradientTo)
      ctx.fillStyle = gradient

      const cursorRadiusSquared = cursorRadius * cursorRadius
      const radius = dotRadius / 2
      ctx.beginPath()

      for (let index = 0; index < dots.length; index++) {
        const dot = dots[index]
        const dx = mouse.x - dot.ax
        const dy = mouse.y - dot.ay
        const distanceSquared = dx * dx + dy * dy

        if (distanceSquared < cursorRadiusSquared && engaged > 0.01) {
          const distance = Math.sqrt(distanceSquared)
          const angle = Math.atan2(dy, dx)

          if (bulgeOnly) {
            const falloff = 1 - distance / cursorRadius
            const push = falloff * falloff * bulgeStrength * engaged
            dot.sx += (dot.ax - Math.cos(angle) * push - dot.sx) * 0.15
            dot.sy += (dot.ay - Math.sin(angle) * push - dot.sy) * 0.15
          } else {
            const move = (500 / Math.max(distance, 1)) * (mouse.speed * cursorForce)
            dot.vx += Math.cos(angle) * -move
            dot.vy += Math.sin(angle) * -move
          }
        } else if (bulgeOnly) {
          dot.sx += (dot.ax - dot.sx) * 0.1
          dot.sy += (dot.ay - dot.sy) * 0.1
        }

        if (!bulgeOnly) {
          dot.vx *= 0.9
          dot.vy *= 0.9
          dot.x = dot.ax + dot.vx
          dot.y = dot.ay + dot.vy
          dot.sx += (dot.x - dot.sx) * 0.1
          dot.sy += (dot.y - dot.sy) * 0.1
        }

        let drawX = dot.sx
        let drawY = dot.sy
        if (waveAmplitude > 0) {
          drawY += Math.sin(dot.ax * 0.03 + time) * waveAmplitude
          drawX += Math.cos(dot.ay * 0.03 + time * 0.7) * waveAmplitude * 0.5
        }

        const sparkleRadius =
          sparkle && (((index * 2654435761) ^ (frameCount >> 3)) >>> 0) % 100 < 3
            ? radius * 1.8
            : radius
        ctx.moveTo(drawX + sparkleRadius, drawY)
        ctx.arc(drawX, drawY, sparkleRadius, 0, TWO_PI)
      }

      ctx.fill()
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(container)
    resize()
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    const speedInterval = window.setInterval(updateMouseSpeed, 20)
    const stopLoop = startRenderLoop(container, render)

    return () => {
      stopLoop()
      resizeObserver.disconnect()
      clearInterval(speedInterval)
      clearTimeout(resizeTimer)
      window.removeEventListener('pointermove', onPointerMove)
    }
  }, [
    bulgeOnly,
    bulgeStrength,
    cursorForce,
    cursorRadius,
    dotRadius,
    dotSpacing,
    gradientFrom,
    gradientTo,
    sparkle,
    waveAmplitude,
  ])

  return (
    <div ref={containerRef} className={`relative h-full w-full ${className}`} {...rest}>
      <canvas ref={canvasRef} className="absolute inset-0 size-full" />
      <svg aria-hidden className="pointer-events-none absolute inset-0 size-full">
        <defs>
          <radialGradient id={glowId}>
            <stop offset="0%" stopColor={glowColor} />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
        <circle
          ref={glowRef}
          cx="-9999"
          cy="-9999"
          r={glowRadius}
          fill={`url(#${glowId})`}
          className="will-change-[opacity]"
          style={{ opacity: 0 }}
        />
      </svg>
    </div>
  )
})

export default DotField
