import { useEffect, useRef, type RefObject } from 'react'
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
uniform vec2 uResolution;
// Вершина дуги от нижней кромки канваса, px канваса; < 0 — по пропорции.
uniform float uApex;

out vec4 fragColor;

const float PI = 3.14159265;
${LIGHT_PALETTE_GLSL}

float easeOutCubic(float value) {
  return 1.0 - pow(1.0 - value, 3.0);
}

vec3 sampleStrandPalette(float t) {
  float scaled = fract(t) * 3.0;

  if (scaled < 1.0) return mix(paleBlue, electricBlue, scaled);
  if (scaled < 2.0) return mix(electricBlue, iceWhite, scaled - 1.0);
  return mix(iceWhite, paleBlue, scaled - 2.0);
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  float reveal = clamp(uReveal, 0.0, 1.0);
  float progress = easeOutCubic(reveal);
  float responsiveMix = smoothstep(0.72, 1.24, aspect);

  // Каждое слагаемое цвета умножается на progress, так что до старта reveal
  // кадр заведомо пустой. Ветка одинакова для всего прохода — она свободна.
  if (progress <= 0.0) {
    fragColor = vec4(0.0);
    return;
  }

  // The original Strands profile, warped onto one fixed orbital curve.
  float halfSpan = uResolution.x * mix(0.56, 0.395, responsiveMix);
  float curveX = (frag.x - uResolution.x * 0.5) / halfSpan;
  float sag = uResolution.x * mix(0.118, 0.153, responsiveMix);
  float finalApex = uApex >= 0.0 ? uApex : uResolution.y * mix(0.69, 0.742, responsiveMix);
  float startApex = finalApex - uResolution.y * mix(0.040, 0.055, responsiveMix);
  float apex = mix(startApex, finalApex, progress);
  float curveY = apex - sag * curveX * curveX;

  // Keep the light profile perpendicular to the curve at every point.
  float slope = -2.0 * sag * curveX / halfSpan;
  float signedDistance = (frag.y - curveY) / sqrt(1.0 + slope * slope);
  float envelope = pow(max(cos(curveX * PI * 0.5), 0.0), 1.72);

  // Envelope входит множителем и в нить, и в гало: за краем дуги — прозрачность.
  if (envelope <= 0.0) {
    fragColor = vec4(0.0);
    return;
  }

  // This is the same non-linear light falloff used by Strands.tsx. The
  // envelope affects both width and energy, creating the heavy luminous crown
  // and the fine, blue shoulders without introducing a separate blur layer.
  float baseThickness = mix(0.95, 7.2, progress);
  float thickness = baseThickness * (0.74 + envelope * 1.56);
  float lowerGlowScale = mix(1.42, 1.0, smoothstep(-6.0, 12.0, signedDistance));
  float distanceToStrand = abs(signedDistance) * lowerGlowScale;
  float strand = thickness / (distanceToStrand + thickness * 0.45);
  strand *= strand;

  // A much wider falloff from the same strand supplies the large atmospheric
  // halo. It inherits the center envelope and the reduced lower-side reach.
  float outerThickness = thickness * (3.1 + envelope * 3.1);
  float outerGlow = outerThickness
    / (distanceToStrand + outerThickness * 0.72);
  outerGlow *= outerGlow;

  vec3 strandColor = sampleStrandPalette(0.665 - abs(curveX) * 0.18);
  vec3 outerColor = mix(
    haloShadow,
    haloBlue,
    envelope
  );
  float intensity = 0.06 + progress * 0.61;
  vec3 color = strandColor * strand * envelope * progress;
  color += outerColor * outerGlow * envelope * progress * 0.24;
  color *= 0.45 + 0.7 * intensity;
  // Гало 1/d² не доходит до нуля и обрезалось верхней кромкой канваса —
  // на стыке с секцией Privacy читалась горизонтальная ступень. Гасим
  // верхние 20% высоты, нить (вершина ниже) это не задевает.
  color *= smoothstep(0.0, uResolution.y * 0.2, uResolution.y - frag.y);
  color = 1.0 - exp(-color * 2.75);

  float alpha = clamp(max(max(color.r, color.g), color.b), 0.0, 1.0);
  fragColor = vec4(color, alpha);
}
`

/** Вершина дуги над верхней кромкой якоря, CSS px. */
const APEX_ABOVE_ANCHOR_PX = 44

interface OrbitalHorizonProps {
  active: boolean
  /**
   * Якорь вершины на узких экранах (< 1024px). Там высота секции зависит от
   * переносов заголовка, и вершина по пропорции высоты попадала на текст;
   * с якорем дуга встаёт прямо над лентами карточек.
   */
  apexRef?: RefObject<HTMLElement | null>
  revealDelayMs?: number
  revealDurationMs?: number
}

/**
 * A single transparent OGL pass for the testimonial-section horizon. The
 * shared render loop pauses it offscreen and resolves reduced motion to a
 * composed final frame instead of removing the graphic.
 *
 * Кадр зависит только от uReveal: как только вступление доиграно, картинка
 * перестаёт меняться, и цикл останавливается вместо того, чтобы бесконечно
 * пересчитывать один и тот же кадр.
 */
export default function OrbitalHorizon({
  active,
  apexRef,
  revealDelayMs = LIGHT_REVEAL_DELAY_MS,
  revealDurationMs = LIGHT_REVEAL_DURATION_MS,
}: OrbitalHorizonProps) {
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
        uResolution: { value: [1, 1] },
        uApex: { value: -1 },
      },
      depthTest: false,
      depthWrite: false,
    })
    const mesh = new Mesh(gl, { geometry, program })

    const resize = () => {
      const { clientWidth: width, clientHeight: height } = container
      renderer.setSize(width, height)
      program.uniforms.uResolution.value = [gl.canvas.width, gl.canvas.height]

      const anchor = apexRef?.current
      if (anchor && width < 1024 && height > 0) {
        const containerRect = container.getBoundingClientRect()
        const anchorTop = anchor.getBoundingClientRect().top - containerRect.top
        const apexFromBottom = height - (anchorTop - APEX_ABOVE_ANCHOR_PX)
        program.uniforms.uApex.value = apexFromBottom * (gl.canvas.height / height)
      } else {
        program.uniforms.uApex.value = -1
      }
      // Смена размера сбрасывает канвас: остановленному циклу нужен новый кадр.
      loopRef.current?.invalidate()
    }

    const observer = new ResizeObserver(resize)
    observer.observe(container)
    if (apexRef?.current) observer.observe(apexRef.current)
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

        // Пока секция не активна, ждать нечего — цикл разбудит invalidate.
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
  }, [revealDurationMs, apexRef])

  return <div ref={containerRef} className="pointer-events-none h-full w-full overflow-hidden" />
}
