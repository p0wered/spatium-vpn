import { useEffect, useRef } from 'react'
import { Mesh, Program, Renderer, Triangle } from 'ogl'
import { startRenderLoop, type RenderLoop } from './loop'
import { LIGHT_PALETTE_GLSL } from './lightPalette'
import { LIGHT_REVEAL_DELAY_MS, LIGHT_REVEAL_DURATION_MS } from './lightMotion'

const VERT = `#version 300 es
in vec2 position;

void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`

const FRAG = `#version 300 es
precision highp float;

uniform float uReveal;
uniform float uRidgeWidth;
uniform vec2 uResolution;

out vec4 fragColor;
${LIGHT_PALETTE_GLSL}

// Прежде яркость дышала как 0.988 + sin(uTime * 0.34) * 0.012 — колебание в
// 1.2% с периодом 18 секунд. На глаз оно неразличимо, но заставляло шейдер
// считаться вечно. Константа равна середине этого колебания.
const float breathe = 0.988;

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec2 p = (uv - 0.5) * 2.0;

  // Отдельная нормализация по осям удерживает силуэт одинаковым на mobile
  // и desktop. Ridge остаётся прямым, меняется только плотность света.
  float x = p.x;
  float y = p.y;
  float ridgeX = x / uRidgeWidth;

  // Ignition обнуляет и свет, и вспышку, и луч: до старта reveal кадр пустой.
  float ignition = smoothstep(0.0, 0.16, uReveal);
  if (ignition <= 0.0) {
    fragColor = vec4(0.0);
    return;
  }

  // uRidgeWidth changes the line's actual shader-space width. The canvas stays
  // oversized so the vertical bloom is not clipped at the container edge.
  float envelope = pow(max(1.0 - ridgeX * ridgeX, 0.0), 1.8);
  if (envelope <= 0.0) {
    fragColor = vec4(0.0);
    return;
  }
  float center = exp(-ridgeX * ridgeX * 4.2);
  float crown = exp(-ridgeX * ridgeX * 9.0);

  // Keep the white ridge visibly dense without widening the surrounding blue bloom.
  float core = exp(-abs(y) * 66.0) * envelope;
  float body = exp(-abs(y) * 13.5) * envelope * (0.34 + center * 0.66);
  float haze = exp(-abs(y) * 4.8) * center * envelope * 0.34;
  float centralHaze = exp(-abs(y) * 2.7) * crown * envelope * 0.14;

  vec3 col = (haze + centralHaze) * haloBlue * 2.2
    + body * paleBlue * 0.78
    + core * coreWhite * 1.45;
  col *= breathe;

  // The ridge propagates as light, not as a center-out clip. A concentrated
  // source ignites first; its horizontal decay lengthens and leaves the final
  // line behind. Every point has a soft tail, so no moving "curtain" edge is
  // ever visible.
  float travelInput = smoothstep(0.04, 0.88, uReveal);
  float travel = 1.0 - pow(1.0 - travelInput, 3.0);
  float settle = smoothstep(0.48, 1.0, uReveal);

  float diffusionWidth = mix(0.035, 0.78, travel);
  float diffusion = exp(-pow(abs(ridgeX) / max(diffusionWidth, 0.001), 1.45));
  float lightField = mix(diffusion, 1.0, settle) * ignition;

  float pulseDistance = (uReveal - 0.2) / 0.14;
  float sourcePulse = exp(-pulseDistance * pulseDistance) * ignition;
  float sourceShape = exp(-ridgeX * ridgeX * 72.0);
  float sourceCore = exp(-abs(y) * 36.0) * sourceShape;
  float sourceBloom = exp(-abs(y) * 5.5) * sourceShape;

  float rayDecay = mix(24.0, 2.2, travel);
  float transientRay = exp(-abs(y) * 105.0)
    * exp(-abs(ridgeX) * rayDecay)
    * envelope
    * ignition
    * (1.0 - settle)
    * 0.7;

  col = col * lightField
    + (sourceCore * coreWhite * 1.05 + sourceBloom * paleBlue * 0.26) * sourcePulse
    + transientRay * coreWhite;
  col = 1.0 - exp(-col * 2.5);

  float alpha = clamp(max(max(col.r, col.g), col.b), 0.0, 1.0);
  fragColor = vec4(col, alpha);
}
`

/**
 * Один холодный световой ridge для верхней кромки Bypass-контейнера.
 * Это самостоятельный fullscreen-pass: без геометрии, post-processing и
 * второго framebuffer. Общий render loop останавливает canvas вне viewport
 * и совсем гасит его, когда вступление доиграно: кадр зависит только от
 * uReveal и дальше не меняется.
 */
interface IceRidgeProps {
  active: boolean
  revealDelayMs?: number
  revealDurationMs?: number
}

export default function IceRidge({
  active,
  revealDelayMs = LIGHT_REVEAL_DELAY_MS,
  revealDurationMs = LIGHT_REVEAL_DURATION_MS,
}: IceRidgeProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef(active)
  const revealStartRef = useRef<number | null>(null)
  const loopRef = useRef<RenderLoop | null>(null)

  useEffect(() => {
    activeRef.current = active
    if (active && revealStartRef.current === null) {
      revealStartRef.current = performance.now() + revealDelayMs
      loopRef.current?.invalidate()
    }
  }, [active, revealDelayMs])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const renderer = new Renderer({
      dpr: Math.min(window.devicePixelRatio, 1.25),
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      powerPreference: 'low-power',
    })
    const gl = renderer.gl
    if (!('drawBuffers' in gl)) return

    gl.clearColor(0, 0, 0, 0)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
    gl.canvas.style.width = '100%'
    gl.canvas.style.height = '100%'
    container.appendChild(gl.canvas)

    const geometry = new Triangle(gl)
    if (geometry.attributes.uv) delete geometry.attributes.uv

    const program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms: {
        uReveal: { value: 0 },
        uRidgeWidth: { value: 0.8 },
        uResolution: { value: [1, 1] },
      },
      depthTest: false,
      depthWrite: false,
    })
    const mesh = new Mesh(gl, { geometry, program })

    const resize = () => {
      const { clientWidth: width, clientHeight: height } = container
      renderer.setSize(width, height)
      program.uniforms.uResolution.value = [gl.canvas.width, gl.canvas.height]
      const configuredWidth = Number.parseFloat(
        getComputedStyle(container).getPropertyValue('--ridge-width'),
      )
      program.uniforms.uRidgeWidth.value = Number.isFinite(configuredWidth)
        ? configuredWidth
        : 0.8
      // Смена размера сбрасывает канвас: остановленному циклу нужен новый кадр.
      loopRef.current?.invalidate()
    }

    const observer = new ResizeObserver(resize)
    observer.observe(container)
    resize()

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const loop = startRenderLoop(
      container,
      (timeMs) => {
        const revealStart = revealStartRef.current
        const rawReveal =
          reducedMotion && activeRef.current
            ? 1
            : revealStart === null
              ? 0
              : Math.min(Math.max((timeMs - revealStart) / revealDurationMs, 0), 1)
        program.uniforms.uReveal.value = rawReveal
        renderer.render({ scene: mesh })

        return revealStart !== null && timeMs < revealStart + revealDurationMs
      },
      { idleFps: 0 },
    )
    loopRef.current = loop

    return () => {
      loopRef.current = null
      loop.stop()
      observer.disconnect()
      gl.getExtension('WEBGL_lose_context')?.loseContext()
      gl.canvas.remove()
    }
  }, [revealDurationMs])

  return (
    <div
      ref={containerRef}
      className="pointer-events-none h-full w-full overflow-hidden [--ridge-width:0.64] sm:[--ridge-width:0.765] lg:[--ridge-width:0.815]"
    />
  )
}
