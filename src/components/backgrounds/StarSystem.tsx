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
uniform vec2 uStar;
uniform vec3 uOrbits;
uniform float uFlatten;
uniform float uPixelRatio;

out vec4 fragColor;
${LIGHT_PALETTE_GLSL}

const float PI = 3.14159265;
const float TILT = 0.07;

float easeOut(float t) {
  return 1.0 - pow(1.0 - clamp(t, 0.0, 1.0), 3.0);
}

// Приближённая дистанция до эллипса (iq): для мягкого профиля света
// точности хватает, а точная формула стоила бы кубического уравнения.
float ellipseDistance(vec2 q, vec2 ab) {
  float k0 = length(q / ab);
  float k1 = length(q / (ab * ab));
  return k0 * (k0 - 1.0) / max(k1, 1e-4);
}

// Орбита — та же линия света, что Ice Ridge: белое ядро, ледяное тело,
// синяя дымка. Свет выходит из передней точки под звездой и расходится по
// эллипсу в обе стороны, как диффузия ridge, без движущейся маски.
vec3 orbit(vec2 q, float radius, float weight, float startAt) {
  vec2 ab = vec2(radius, radius * uFlatten);
  float d = abs(ellipseDistance(q, ab));

  float theta = atan(q.y / ab.y, q.x / ab.x);
  float fromFront = abs(atan(sin(theta + PI * 0.5), cos(theta + PI * 0.5))) / PI;
  // Задняя половина уходит за звезду и почти гаснет: так эллипс читается
  // объёмным, а над карточками не появляются линии поперёк подзаголовка.
  float depth = 0.5 - 0.5 * sin(theta);
  float facing = mix(0.025, 1.0, smoothstep(0.08, 0.62, depth));

  float local = uReveal - startAt;
  float ignition = smoothstep(0.0, 0.06, local);
  float travel = easeOut(local / 0.62);
  float settle = smoothstep(0.28, 0.72, local);
  float diffusionWidth = mix(0.02, 1.25, travel);
  float diffusion = exp(-pow(fromFront / max(diffusionWidth, 0.001), 1.45));
  float field = mix(diffusion, 1.0, settle) * ignition;

  float core = exp(-pow(d / 0.9, 1.4));
  float body = exp(-d / 3.6);
  float glow = exp(-d / 11.0);
  float haze = exp(-d / 34.0);

  return (core * coreWhite * 1.35
    + body * paleBlue * 0.55
    + glow * electricBlue * 0.32
    + haze * haloShadow * 0.16)
    * facing * weight * field;
}

void main() {
  if (uReveal <= 0.0) {
    fragColor = vec4(0.0);
    return;
  }

  vec2 q = (gl_FragCoord.xy - uStar) / uPixelRatio;
  float c = cos(TILT);
  float s = sin(TILT);
  q = mat2(c, s, -s, c) * q;

  // Звезда загорается первой: короткая вспышка источника, затем лучи
  // вытягиваются до финальной длины.
  float ignite = easeOut(uReveal / 0.32);
  float r = length(q);
  float core = exp(-pow(r / 2.6, 1.25));
  float body = exp(-r / 12.0);
  float bloom = exp(-r / 48.0);
  // Ореол держится у звезды: широкий свет под стеклом заливал бы карточки
  // серым, а остальные секции оставляют панели под светом чёрными.
  float halo = exp(-length(q * vec2(0.5, 1.0)) / 80.0);

  float rayX = abs(q.x);
  float rayY = abs(q.y);
  float spikeH = exp(-pow(rayY / 0.8, 1.3)) * exp(-rayX / (8.0 + 112.0 * ignite));
  float spikeHBody = exp(-rayY / 5.0) * exp(-rayX / (6.0 + 64.0 * ignite));
  float spikeV = exp(-pow(rayX / 0.8, 1.3)) * exp(-rayY / (4.0 + 26.0 * ignite));

  vec3 star = (core * coreWhite * 2.2
    + body * iceWhite * 0.9
    + bloom * paleBlue * 0.55
    + halo * haloBlue * 0.3
    + spikeH * coreWhite * 0.9
    + spikeHBody * paleBlue * 0.24
    + spikeV * iceWhite * 0.6) * ignite;

  float pulseDistance = (uReveal - 0.14) / 0.09;
  float pulse = exp(-pulseDistance * pulseDistance);
  star += (core * coreWhite * 1.4 + bloom * paleBlue * 0.5) * pulse;

  vec3 col = star
    + orbit(q, uOrbits.x, 1.0, 0.12)
    + orbit(q, uOrbits.y, 0.8, 0.2)
    + orbit(q, uOrbits.z, 0.6, 0.28);
  col = 1.0 - exp(-col * 1.3);

  float alpha = clamp(max(max(col.r, col.g), col.b), 0.0, 1.0);
  fragColor = vec4(col, alpha);
}
`

/** Радиусы орбит в ширинах выделенной карточки. */
const ORBITS_WIDE: [number, number, number] = [0.64, 1.26, 1.9]
const ORBITS_STACKED: [number, number, number] = [0.5, 0.82, 1.14]
const STAR_LIFT_PX = 10

interface StarSystemProps {
  active: boolean
  /** Выделенная карточка тарифа: звезда стоит на её верхней кромке. */
  anchorRef: RefObject<HTMLElement | null>
}

/**
 * Свет Pricing: звезда над выделенным тарифом и три орбиты, которые проходят
 * за боковыми карточками. Стекло карточек размывает их, в зазорах линии
 * остаются резкими.
 *
 * Кадр зависит только от uReveal и геометрии карточки, поэтому после
 * вступления цикл останавливается — до следующего resize или смены active.
 */
export default function StarSystem({ active, anchorRef }: StarSystemProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef(active)
  const revealStartRef = useRef<number | null>(null)
  const loopRef = useRef<RenderLoop | null>(null)

  useEffect(() => {
    activeRef.current = active
    if (active && revealStartRef.current === null) {
      revealStartRef.current = performance.now() + LIGHT_REVEAL_DELAY_MS
      loopRef.current?.invalidate()
    }
  }, [active])

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
        uStar: { value: [0, 0] },
        uOrbits: { value: [1, 1, 1] },
        uFlatten: { value: 0.2 },
        uPixelRatio: { value: 1 },
      },
      transparent: true,
      depthTest: false,
      depthWrite: false,
    })
    const mesh = new Mesh(gl, { geometry, program })

    const resize = () => {
      const width = container.clientWidth
      const height = container.clientHeight
      const anchor = anchorRef.current
      const parent = anchor?.offsetParent
      if (width === 0 || height === 0 || !anchor || !(parent instanceof HTMLElement)) return

      renderer.setSize(width, height)
      // Карточка въезжает с translateY, а getBoundingClientRect учитывает
      // transform. Позиция по offset* — это место, где карточка окажется
      // после reveal, поэтому звезда не съезжает при раннем resize.
      const containerRect = container.getBoundingClientRect()
      const parentRect = parent.getBoundingClientRect()
      const left = parentRect.left - containerRect.left + anchor.offsetLeft
      const top = parentRect.top - containerRect.top + anchor.offsetTop
      const cardWidth = anchor.offsetWidth

      const stacked = window.matchMedia('(max-width: 1023px)').matches
      const orbits = stacked ? ORBITS_STACKED : ORBITS_WIDE
      const ratio = gl.canvas.width / width

      program.uniforms.uPixelRatio.value = ratio
      // Звезда чуть выше кромки: ядро и лучи остаются резкими, под стекло
      // уходит только нижняя часть свечения.
      const starY = top - STAR_LIFT_PX
      program.uniforms.uStar.value = [(left + cardWidth / 2) * ratio, (height - starY) * ratio]
      program.uniforms.uOrbits.value = orbits.map((k) => k * cardWidth)
      program.uniforms.uFlatten.value = stacked ? 0.16 : 0.2
      // Кадр остановленного цикла остался от прежней геометрии — перерисовать.
      loopRef.current?.invalidate()
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(container)
    if (anchorRef.current) resizeObserver.observe(anchorRef.current)
    resize()

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const loop = startRenderLoop(
      container,
      (timeMs) => {
        const revealStart = revealStartRef.current
        const reveal =
          reducedMotion && activeRef.current
            ? 1
            : revealStart === null
              ? 0
              : Math.min(Math.max((timeMs - revealStart) / LIGHT_REVEAL_DURATION_MS, 0), 1)
        program.uniforms.uReveal.value = reveal
        renderer.render({ scene: mesh })

        return revealStart !== null && timeMs < revealStart + LIGHT_REVEAL_DURATION_MS
      },
      { idleFps: 0 },
    )
    loopRef.current = loop

    return () => {
      loopRef.current = null
      loop.stop()
      resizeObserver.disconnect()
      gl.getExtension('WEBGL_lose_context')?.loseContext()
      gl.canvas.remove()
    }
  }, [anchorRef])

  return <div ref={containerRef} className="h-full w-full" />
}
