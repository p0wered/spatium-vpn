import { useEffect, useRef } from 'react'
import { Mesh, Program, Renderer, Triangle } from 'ogl'
import { startRenderLoop } from './loop'

const VERT = `#version 300 es
in vec2 position;

void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`

const FRAG = `#version 300 es
precision highp float;

uniform float uTime;
uniform float uReveal;
uniform float uRidgeWidth;
uniform vec2 uResolution;

out vec4 fragColor;

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec2 p = (uv - 0.5) * 2.0;

  // Отдельная нормализация по осям удерживает силуэт одинаковым на mobile
  // и desktop. Ridge остаётся прямым, меняется только плотность света.
  float x = p.x;
  float y = p.y;
  float ridgeX = x / uRidgeWidth;

  // uRidgeWidth changes the line's actual shader-space width. The canvas stays
  // oversized so the vertical bloom is not clipped at the container edge.
  float envelope = pow(max(1.0 - ridgeX * ridgeX, 0.0), 1.8);
  float center = exp(-ridgeX * ridgeX * 4.2);
  float crown = exp(-ridgeX * ridgeX * 9.0);
  float breathe = 0.965 + sin(uTime * 0.28) * 0.035;

  // Keep the white ridge visibly dense without widening the surrounding blue bloom.
  float core = exp(-abs(y) * 66.0) * envelope;
  float body = exp(-abs(y) * 13.5) * envelope * (0.34 + center * 0.66);
  float haze = exp(-abs(y) * 4.8) * center * envelope * 0.34;
  float centralHaze = exp(-abs(y) * 2.7) * crown * envelope * 0.14;

  vec3 ice = vec3(0.56, 0.68, 0.92);
  vec3 frost = vec3(0.80, 0.87, 1.0);
  vec3 white = vec3(1.0);

  vec3 col = (haze + centralHaze) * ice * 3.9
    + body * frost * 0.9
    + core * white * 1.1;
  col *= breathe;

  // The ridge propagates as light, not as a center-out clip. A concentrated
  // source ignites first; its horizontal decay lengthens and leaves the final
  // line behind. Every point has a soft tail, so no moving "curtain" edge is
  // ever visible.
  float ignition = smoothstep(0.0, 0.16, uReveal);
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
    + (sourceCore * 1.05 + sourceBloom * 0.26) * sourcePulse * frost
    + transientRay * white;
  col = 1.0 - exp(-col * 2.5);

  float alpha = clamp(max(max(col.r, col.g), col.b), 0.0, 1.0);
  fragColor = vec4(col, alpha);
}
`

/**
 * Один холодный световой ridge для верхней кромки Bypass-контейнера.
 * Это самостоятельный fullscreen-pass: без геометрии, post-processing и
 * второго framebuffer. Общий render loop останавливает canvas вне viewport.
 */
interface IceRidgeProps {
  active: boolean
  revealDelayMs?: number
  revealDurationMs?: number
}

export default function IceRidge({
  active,
  revealDelayMs = 1050,
  revealDurationMs = 600,
}: IceRidgeProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef(active)
  const revealStartRef = useRef<number | null>(null)

  useEffect(() => {
    activeRef.current = active
    if (active && revealStartRef.current === null) {
      revealStartRef.current = performance.now() + revealDelayMs
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
        uTime: { value: 0 },
        uReveal: { value: 0 },
        uRidgeWidth: { value: 0.8 },
        uResolution: { value: [1, 1] },
      },
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
    }

    const observer = new ResizeObserver(resize)
    observer.observe(container)
    resize()

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const stopLoop = startRenderLoop(container, (timeMs) => {
      program.uniforms.uTime.value = timeMs * 0.001
      const revealStart = revealStartRef.current
      const rawReveal =
        reducedMotion && activeRef.current
          ? 1
          : revealStart === null
            ? 0
            : Math.min(Math.max((timeMs - revealStart) / revealDurationMs, 0), 1)
      program.uniforms.uReveal.value = rawReveal
      renderer.render({ scene: mesh })
    })

    return () => {
      stopLoop()
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
