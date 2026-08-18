import { useEffect, useRef } from 'react'
import { Color, Mesh, Program, Renderer, Triangle } from 'ogl'
import { PRISM_FIELD_FRAG, PRISM_FIELD_VERT } from './prismFieldShader'

const PASSAGE_MS = 2450

/**
 * Быстрые настройки света Bypass. Цвета ядра и ореола разделены: так можно
 * оставить сам луч белым, а холодный оттенок дать только его спаду — как в
 * Strands у Hero. После изменения достаточно сохранить файл (Vite обновит
 * превью автоматически).
 */
export const PRISM_LIGHT_SETTINGS = {
  beamCore: '#dceeff',
  beamGlow: '#b4d2ff',
  contactCore: '#ffffff',
  contactGlow: '#b4d2ff',
  glassEdge: '#a8b8d0',
  glow: 0.7,
  taper: 6,
  edgeFade: 0.13,
  desktopGateSpan: 0.66,
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
        uGateCount: { value: 12 },
        uMobile: { value: 0 },
        uContentLeft: { value: 0.125 },
        uDesktopGateSpan: { value: PRISM_LIGHT_SETTINGS.desktopGateSpan },
        uBeamCoreColor: { value: rgb(PRISM_LIGHT_SETTINGS.beamCore) },
        uBeamGlowColor: { value: rgb(PRISM_LIGHT_SETTINGS.beamGlow) },
        uContactCoreColor: { value: rgb(PRISM_LIGHT_SETTINGS.contactCore) },
        uContactGlowColor: { value: rgb(PRISM_LIGHT_SETTINGS.contactGlow) },
        uGlassEdgeColor: { value: rgb(PRISM_LIGHT_SETTINGS.glassEdge) },
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
      program.uniforms.uGateCount.value = mobile ? 7 : 12

      // Тот же геометрический inset, что у `mx-auto max-w-6xl px-6` в Bypass.
      // Поэтому первая призма совпадает с текстом на любом desktop viewport,
      // а не только в одном зафиксированном размере экрана.
      const contentWidth = Math.min(width, 1152)
      const contentLeft = (width - contentWidth) * 0.5 + 24
      program.uniforms.uContentLeft.value = contentLeft / Math.max(width, 1)
    }
    const ro = new ResizeObserver(resize)
    ro.observe(container)
    resize()

    let raf = 0
    let visible = false
    let startedAt: number | null = null

    const render = (now: number) => {
      if (!visible) return

      if (activeRef.current && startedAt === null) startedAt = now
      const elapsed = startedAt === null ? 0 : now - startedAt
      const progress = reduced ? 1 : Math.min(elapsed / PASSAGE_MS, 1)
      const idleTime = progress >= 1 ? Math.max(elapsed - PASSAGE_MS, 0) * 0.001 : 0

      program.uniforms.uTime.value = now * 0.001
      program.uniforms.uProgress.value = progress
      program.uniforms.uIdleTime.value = reduced ? 1 : idleTime
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

  return <div ref={containerRef} aria-hidden className={`pointer-events-none ${className}`} />
}
