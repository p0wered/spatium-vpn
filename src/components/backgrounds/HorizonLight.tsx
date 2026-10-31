import { useEffect, useRef } from 'react'
import { Mesh, Program, Renderer, Triangle } from 'ogl'
import { startRenderLoop, type RenderLoop } from './loop'
import { LIGHT_PALETTE_GLSL } from './lightPalette'
import { LIGHT_REVEAL_DELAY_MS } from './lightMotion'

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
// Линия горизонта — в пикселях канваса от нижнего края
uniform float uLineY;
// Пикселей канваса на CSS-пиксель: толщины задаются в CSS-пикселях
uniform float uScale;

out vec4 fragColor;

const float PI = 3.14159265;
${LIGHT_PALETTE_GLSL}

vec3 sampleStrandPalette(float t) {
  float scaled = fract(t) * 3.0;

  if (scaled < 1.0) return mix(paleBlue, electricBlue, scaled);
  if (scaled < 2.0) return mix(electricBlue, iceWhite, scaled - 1.0);
  return mix(iceWhite, paleBlue, scaled - 2.0);
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  float reveal = clamp(uReveal, 0.0, 1.0);

  // До старта reveal кадр пустой: все слагаемые ниже умножаются на ignition.
  float ignition = smoothstep(0.0, 0.16, reveal);
  if (ignition <= 0.0) {
    fragColor = vec4(0.0);
    return;
  }

  // На узком экране линия занимает большую долю ширины, иначе от неё
  // остаётся одна яркая точка.
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  float wide = smoothstep(0.7, 2.0, aspect);
  float halfSpan = uResolution.x * mix(0.64, 0.42, wide);
  // Вордмарк на телефоне в разы меньше — свет ужимается вместе с ним
  float fit = mix(0.62, 1.0, wide);
  float x = (frag.x - uResolution.x * 0.5) / halfSpan;
  if (abs(x) >= 1.0) {
    fragColor = vec4(0.0);
    return;
  }
  float envelope = pow(cos(x * PI * 0.5), 1.72);

  // Над горизонтом свет уходит дальше — он подсвечивает буквы; под линией
  // спадает быстрее, как у OrbitalHorizon.
  float signedDistance = (frag.y - uLineY) / uScale;
  float lowerScale = mix(1.7, 1.0, smoothstep(-6.0, 10.0, signedDistance));
  float distanceToStrand = abs(signedDistance) * lowerScale;

  // Тот же нелинейный профиль, что у Strands и OrbitalHorizon: огибающая
  // меняет и толщину, и энергию — плотная корона в центре, тонкие плечи.
  float thickness = 4.2 * fit * (0.6 + envelope * 1.0);
  float strand = thickness / (distanceToStrand + thickness * 0.45);
  strand *= strand;

  float outerThickness = thickness * (3.2 + envelope * 3.4);
  float outerGlow = outerThickness / (distanceToStrand + outerThickness * 0.72);
  outerGlow *= outerGlow;

  // Широкая атмосфера над линией — свет «из-за горизонта», на фоне которого
  // поднимается вордмарк.
  float crown = exp(-x * x * 5.0);
  float above = max(signedDistance, 0.0);
  // Верхний край канваса гасит атмосферу до нуля, иначе её хвост
  // обрывается видимой горизонтальной кромкой.
  float topFade = 1.0 - smoothstep(0.55, 0.95, frag.y / uResolution.y);
  float atmosphere = exp(-above / (120.0 * fit)) * crown * topFade
    * smoothstep(-24.0, 6.0, signedDistance);

  vec3 strandColor = sampleStrandPalette(0.665 - abs(x) * 0.18);
  vec3 outerColor = mix(haloShadow, haloBlue, envelope);

  vec3 color = strandColor * strand * envelope;
  color += outerColor * outerGlow * envelope * 0.24;
  color += haloBlue * atmosphere * 0.16;

  // Свет распространяется от источника в центре, а не открывается шторкой:
  // сначала вспыхивает точка, затем её спад по горизонтали удлиняется.
  float travelInput = smoothstep(0.04, 0.88, reveal);
  float travel = 1.0 - pow(1.0 - travelInput, 3.0);
  float settle = smoothstep(0.48, 1.0, reveal);
  float diffusionWidth = mix(0.035, 0.85, travel);
  float diffusion = exp(-pow(abs(x) / diffusionWidth, 1.45));
  float lightField = mix(diffusion, 1.0, settle) * ignition;

  float pulseDistance = (reveal - 0.2) / 0.14;
  float sourcePulse = exp(-pulseDistance * pulseDistance) * ignition;
  float sourceShape = exp(-x * x * 72.0);
  float sourceGlow = exp(-distanceToStrand / 14.0) * sourceShape;

  color = color * lightField * 0.62 + sourceGlow * coreWhite * sourcePulse * 0.9;
  color = 1.0 - exp(-color * 2.75);

  float alpha = clamp(max(max(color.r, color.g), color.b), 0.0, 1.0);
  fragColor = vec4(color, alpha);
}
`

interface HorizonLightProps {
  active: boolean
  /** Положение линии горизонта: CSS-пиксели от нижнего края контейнера */
  lineOffset: number
  revealDelayMs?: number
  revealDurationMs?: number
}

/**
 * Прямой световой горизонт футера: профиль нити из OrbitalHorizon, вступление
 * из IceRidge (вспышка в центре и растекание света к краям). Один
 * прозрачный fullscreen-pass; после reveal кадр не меняется, и цикл встаёт.
 */
export default function HorizonLight({
  active,
  lineOffset,
  revealDelayMs = LIGHT_REVEAL_DELAY_MS,
  revealDurationMs = 2200,
}: HorizonLightProps) {
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
        uLineY: { value: 0 },
        uScale: { value: 1 },
      },
      depthTest: false,
      depthWrite: false,
    })
    const mesh = new Mesh(gl, { geometry, program })

    const resize = () => {
      const { clientWidth: width, clientHeight: height } = container
      renderer.setSize(width, height)
      const scale = gl.canvas.width / Math.max(width, 1)
      program.uniforms.uResolution.value = [gl.canvas.width, gl.canvas.height]
      program.uniforms.uScale.value = scale
      program.uniforms.uLineY.value = lineOffset * scale
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
  }, [lineOffset, revealDurationMs])

  return <div ref={containerRef} className="pointer-events-none h-full w-full overflow-hidden" />
}
