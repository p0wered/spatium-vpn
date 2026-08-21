import { useEffect, useRef } from 'react'
import { Color, Mesh, Program, Renderer, Triangle } from 'ogl'
import { PRISM_FIELD_FRAG, PRISM_FIELD_VERT } from './prismFieldShader'

const PASSAGE_MS = 2450
const MODULES = ['SNI', 'TLS FP', 'L7', 'POLICY', 'RATE'] as const
const DESKTOP_HALF_WIDTH = 0.034
const DESKTOP_HALF_HEIGHT = 0.17

/**
 * Быстрые настройки Bypass. Цвета ядра и ореола разделены: так можно
 * оставить сам луч белым, а холодный оттенок дать только его спаду — как в
 * Strands у Hero. diagram задаёт только матовые линии схемы; он не светится.
 */
export const PRISM_LIGHT_SETTINGS = {
  beamCore: '#dceeff',
  beamGlow: '#b4d2ff',
  contactCore: '#ffffff',
  contactGlow: '#b4d2ff',
  diagram: '#a8b8d0',
  glow: 0.7,
  taper: 6,
  edgeFade: 0.13,
  // Свободный промежуток между соседними модулями примерно в 1.5 раза
  // меньше исходного. На desktop сохраняем левый контентный якорь, на
  // mobile — центрируем более компактную группу симметричными inset'ами.
  desktopGateSpan: 0.54,
  mobileGateInset: 0.118,
} as const

const rgb = (hex: string) => {
  const color = new Color(hex)
  return [color.r, color.g, color.b]
}

export function PrismField({
  active,
  className = '',
}: {
  active: boolean
  className?: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const moduleLabelRefs = useRef<Array<HTMLDivElement | null>>([])
  const statusRefs = useRef<Array<HTMLSpanElement | null>>([])
  const activeRef = useRef(active)
  activeRef.current = active

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const renderer = new Renderer({
      dpr: Math.min(window.devicePixelRatio, 2),
      alpha: true,
      premultipliedAlpha: true,
      antialias: true,
    })
    const gl = renderer.gl
    if (!('drawBuffers' in gl)) return

    gl.clearColor(0, 0, 0, 0)
    gl.canvas.style.width = '100%'
    gl.canvas.style.height = '100%'
    gl.canvas.style.position = 'absolute'
    gl.canvas.style.inset = '0'
    gl.canvas.style.zIndex = '0'
    container.appendChild(gl.canvas)

    const geometry = new Triangle(gl)
    if (geometry.attributes.uv) delete geometry.attributes.uv

    const program = new Program(gl, {
      vertex: PRISM_FIELD_VERT,
      fragment: PRISM_FIELD_FRAG,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      cullFace: null,
      uniforms: {
        uResolution: { value: [1, 1] },
        uTime: { value: 0 },
        uProgress: { value: reduced ? 1 : 0 },
        uIdleTime: { value: reduced ? 1 : 0 },
        uGateCount: { value: 5 },
        uMobile: { value: 0 },
        uContentLeft: { value: 0.125 },
        uDesktopGateSpan: { value: PRISM_LIGHT_SETTINGS.desktopGateSpan },
        uMobileGateInset: { value: PRISM_LIGHT_SETTINGS.mobileGateInset },
        uBeamCoreColor: { value: rgb(PRISM_LIGHT_SETTINGS.beamCore) },
        uBeamGlowColor: { value: rgb(PRISM_LIGHT_SETTINGS.beamGlow) },
        uContactCoreColor: { value: rgb(PRISM_LIGHT_SETTINGS.contactCore) },
        uContactGlowColor: { value: rgb(PRISM_LIGHT_SETTINGS.contactGlow) },
        uGlassEdgeColor: { value: rgb(PRISM_LIGHT_SETTINGS.diagram) },
        uGlow: { value: PRISM_LIGHT_SETTINGS.glow },
        uTaper: { value: PRISM_LIGHT_SETTINGS.taper },
        uEdgeFade: { value: PRISM_LIGHT_SETTINGS.edgeFade },
      },
    })
    program.setBlendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
    const mesh = new Mesh(gl, { geometry, program })

    const resize = () => {
      const { clientWidth: width, clientHeight: height } = container
      renderer.setSize(width, height)
      program.uniforms.uResolution.value = [gl.canvas.width, gl.canvas.height]
      const mobile = width / Math.max(height, 1) < 0.78
      program.uniforms.uMobile.value = mobile ? 1 : 0
      program.uniforms.uGateCount.value = 5

      // Тот же геометрический inset, что у `mx-auto max-w-6xl px-6` в Bypass.
      // Поэтому первая призма совпадает с текстом на любом desktop viewport,
      // а не только в одном зафиксированном размере экрана.
      const contentWidth = Math.min(width, 1152)
      const contentLeft = (width - contentWidth) * 0.5 + 24
      const contentLeftNorm = contentLeft / Math.max(width, 1)
      program.uniforms.uContentLeft.value = contentLeftNorm

      const halfWidths = MODULES.map(() => mobile ? 0.052 : DESKTOP_HALF_WIDTH)
      const halfHeights = MODULES.map(() => mobile ? 0.122 : DESKTOP_HALF_HEIGHT)
      const firstX = mobile
        ? PRISM_LIGHT_SETTINGS.mobileGateInset + halfWidths[0]
        : contentLeftNorm + halfWidths[0]
      const lastX = mobile
        ? 1 - PRISM_LIGHT_SETTINGS.mobileGateInset - halfWidths[MODULES.length - 1]
        : Math.min(contentLeftNorm + PRISM_LIGHT_SETTINGS.desktopGateSpan, 0.94)
      const centerY = mobile ? 0.385 : 0.389

      MODULES.forEach((_, index) => {
        const label = moduleLabelRefs.current[index]
        if (!label) return
        const t = index / (MODULES.length - 1)
        const x = firstX + (lastX - firstX) * t
        label.style.left = `${(x - halfWidths[index]) * 100}%`
        label.style.top = `${(1 - centerY - halfHeights[index]) * 100}%`
      })

      const noMatch = statusRefs.current[0]
      const bypass = statusRefs.current[1]
      if (noMatch) {
        noMatch.style.left = `${(firstX + (lastX - firstX) * 0.34) * 100}%`
        noMatch.style.top = `${(1 - centerY + 0.058) * 100}%`
      }
      if (bypass) {
        bypass.style.left = `${(lastX + halfWidths[4] + 0.014) * 100}%`
        bypass.style.top = `${(1 - centerY + 0.058) * 100}%`
      }
    }
    const ro = new ResizeObserver(resize)
    ro.observe(container)
    resize()

    let raf = 0
    let visible = false
    let startedAt: number | null = null

    const smoothstep = (edge0: number, edge1: number, value: number) => {
      const x = Math.min(Math.max((value - edge0) / (edge1 - edge0), 0), 1)
      return x * x * (3 - 2 * x)
    }

    const idleSignalAtX = (x: number, time: number) => {
      if (time < 1.8) return 0
      const phase = ((time - 1.8) % 4.55) / 4.55
      const travel = Math.min(Math.max(phase / 0.45, 0), 1)
      const active = 1 - smoothstep(0.42, 0.45, phase)
      const headX = -0.12 + 1.24 * smoothstep(0, 1, travel)
      return Math.exp(-(((x - headX) / 0.105) ** 2)) * active
    }

    const updateLabels = (progress: number, idleTime: number) => {
      const mobile = program.uniforms.uMobile.value > 0.5
      const contentLeftNorm = program.uniforms.uContentLeft.value as number
      const halfWidths = MODULES.map(() => mobile ? 0.052 : DESKTOP_HALF_WIDTH)
      const firstX = mobile
        ? PRISM_LIGHT_SETTINGS.mobileGateInset + halfWidths[0]
        : contentLeftNorm + halfWidths[0]
      const lastX = mobile
        ? 1 - PRISM_LIGHT_SETTINGS.mobileGateInset - halfWidths[MODULES.length - 1]
        : Math.min(contentLeftNorm + PRISM_LIGHT_SETTINGS.desktopGateSpan, 0.94)
      const revealX = -0.08 + 1.16 * smoothstep(0.03, 0.96, progress)
      const settled = smoothstep(0.78, 1, progress)

      MODULES.forEach((_, index) => {
        const label = moduleLabelRefs.current[index]
        if (!label) return
        const x = firstX + (lastX - firstX) * (index / (MODULES.length - 1))
        const localReveal = Math.exp(-(((x - revealX) / (mobile ? 0.145 : 0.105)) ** 2))
        const idleReveal = idleSignalAtX(x, idleTime)
        label.style.opacity = `${0.1 + settled * 0.26 + localReveal * 0.42 + idleReveal * 0.2}`
      })

      statusRefs.current.forEach((status, index) => {
        if (!status) return
        const threshold = index === 0 ? 0.52 : 0.82
        status.style.opacity = `${smoothstep(threshold, threshold + 0.08, progress) * 0.42}`
      })
    }

    const render = (now: number) => {
      if (!visible) return

      if (activeRef.current && startedAt === null) startedAt = now
      const elapsed = startedAt === null ? 0 : now - startedAt
      const progress = reduced ? 1 : Math.min(elapsed / PASSAGE_MS, 1)
      const idleTime = progress >= 1 ? Math.max(elapsed - PASSAGE_MS, 0) * 0.001 : 0

      program.uniforms.uTime.value = now * 0.001
      program.uniforms.uProgress.value = progress
      program.uniforms.uIdleTime.value = reduced ? 1 : idleTime
      updateLabels(progress, reduced ? 1 : idleTime)
      renderer.render({ scene: mesh })

      if (!reduced) raf = requestAnimationFrame(render)
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting
        cancelAnimationFrame(raf)
        if (visible) {
          if (reduced) render(performance.now())
          else raf = requestAnimationFrame(render)
        }
      },
      { threshold: 0.05 },
    )
    io.observe(container)

    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      ro.disconnect()
      gl.getExtension('WEBGL_lose_context')?.loseContext()
      gl.canvas.remove()
    }
  }, [])

  return (
    <div ref={containerRef} aria-hidden className={`pointer-events-none ${className}`}>
      <div className="absolute inset-0 z-[1] hidden font-mono sm:block">
        {MODULES.map((name, index) => (
          <div
            key={name}
            ref={(node) => {
              moduleLabelRefs.current[index] = node
            }}
            className="absolute translate-x-3 translate-y-3 opacity-0 will-change-[opacity]"
          >
            <p className="text-[10px] tracking-[0.13em] text-white/80 uppercase">{name}</p>
            <p className="mt-0.5 text-[9px] tracking-[0.12em] text-white/36">0{index + 1}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
