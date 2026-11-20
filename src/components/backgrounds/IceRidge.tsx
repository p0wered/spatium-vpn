import { useEffect, useRef, type RefObject } from 'react'
import { Mesh, Program, Renderer, Triangle } from 'ogl'
import { createFrostedLight } from './frostedLight'
import { startRenderLoop, type RenderLoop } from './loop'
import { GLOW_LINE_GLSL } from './glowLine'
import { LIGHT_REVEAL_DELAY_MS, LIGHT_REVEAL_DURATION_MS } from './lightMotion'

/** Размытие света под стеклом панели, CSS px — прежний backdrop-filter: blur(48px). */
const GLASS_BLUR_PX = 48
/** Скругление панели (.bypass-shell). */
const GLASS_RADIUS_PX = 24
/**
 * Насколько канвас длиннее световой полосы вниз. Блюр растягивает свет под
 * стеклом на три сигмы дальше нижней кромки полосы — этому хвосту нужно место.
 */
const GLASS_BLEED_PX = GLASS_BLUR_PX * 3

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
// Высота световой полосы в пикселях канваса. Гребень лежит на её середине.
uniform float uBandHeight;
// Пикселей канваса в CSS-пикселе по вертикали
uniform float uPxScale;

out vec4 fragColor;
${GLOW_LINE_GLSL}

// Прежде яркость дышала как 0.988 + sin(uTime * 0.34) * 0.012 — колебание в
// 1.2% с периодом 18 секунд. На глаз оно неразличимо, но заставляло шейдер
// считаться вечно. Константа равна середине этого колебания.
const float breathe = 0.988;

void main() {
  // Канвас длиннее полосы вниз (запас под блюр стекла), но сам свет считается
  // в координатах полосы и за её пределами обрывается — как раньше, когда
  // полоса и была канвасом. Иначе под стекло попал бы свет, которого не было.
  float ridgeY = uResolution.y - uBandHeight * 0.5;
  vec2 p = vec2(
    (gl_FragCoord.x / uResolution.x - 0.5) * 2.0,
    (gl_FragCoord.y - ridgeY) / (uBandHeight * 0.5)
  );
  if (abs(p.y) > 1.0) {
    fragColor = vec4(0.0);
    return;
  }

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

  // Свечение считается в CSS-пикселях от гребня, а не в долях полосы: ширина
  // ореола не должна зависеть от высоты полосы на разных брейкпоинтах.
  float d = abs(gl_FragCoord.y - ridgeY) / uPxScale;

  // Профиль линии общий для всей вторичной графики (glowLine.ts).
  vec3 col = glowLine(d, d, envelope, center) + glowBloom(d, 46.0, crown * envelope);

  // Дальний хвост 1/d² не должен обрываться о границу полосы.
  col *= 1.0 - smoothstep(0.6, 1.0, abs(y));
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
  col = glowTonemap(col);

  float alpha = clamp(max(max(col.r, col.g), col.b), 0.0, 1.0);
  fragColor = vec4(col, alpha);
}
`

/**
 * Один холодный световой ridge для верхней кромки Bypass-контейнера.
 * Нижняя половина света уходит под стекло панели и там размыта — это делает
 * сам канвас (frostedLight), а не backdrop-filter панели. Общий render loop
 * останавливает canvas вне viewport и совсем гасит его, когда вступление
 * доиграно: кадр зависит только от uReveal и дальше не меняется, поэтому и
 * блюр после вступления не стоит ничего.
 */
interface IceRidgeProps {
  active: boolean
  /** Панель, под которую уходит свет: в её границах он выводится размытым. */
  anchorRef: RefObject<HTMLElement | null>
  revealDelayMs?: number
  revealDurationMs?: number
}

export default function IceRidge({
  active,
  anchorRef,
  revealDelayMs = LIGHT_REVEAL_DELAY_MS,
  revealDurationMs = LIGHT_REVEAL_DURATION_MS,
}: IceRidgeProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasHostRef = useRef<HTMLDivElement>(null)
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
    const canvasHost = canvasHostRef.current
    if (!container || !canvasHost) return

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
    canvasHost.appendChild(gl.canvas)

    const geometry = new Triangle(gl)
    if (geometry.attributes.uv) delete geometry.attributes.uv

    const program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms: {
        uReveal: { value: 0 },
        uRidgeWidth: { value: 0.8 },
        uResolution: { value: [1, 1] },
        uBandHeight: { value: 1 },
        uPxScale: { value: 1 },
      },
      depthTest: false,
      depthWrite: false,
    })
    const mesh = new Mesh(gl, { geometry, program })
    const frost = createFrostedLight(gl, renderer, mesh)

    const resize = () => {
      const { clientWidth: width, clientHeight: height } = canvasHost
      if (width === 0 || height === 0) return

      renderer.setSize(width, height)
      const scaleX = gl.canvas.width / width
      const scaleY = gl.canvas.height / height
      program.uniforms.uResolution.value = [gl.canvas.width, gl.canvas.height]
      program.uniforms.uBandHeight.value = container.clientHeight * scaleY
      program.uniforms.uPxScale.value = scaleY

      frost.setSize(gl.canvas.width, gl.canvas.height)
      const anchor = anchorRef.current
      if (anchor) {
        const hostRect = canvasHost.getBoundingClientRect()
        const anchorRect = anchor.getBoundingClientRect()
        frost.setGlass(
          {
            left: (anchorRect.left - hostRect.left) * scaleX,
            top: (anchorRect.top - hostRect.top) * scaleY,
            width: anchorRect.width * scaleX,
            height: anchorRect.height * scaleY,
          },
          GLASS_RADIUS_PX * scaleX,
          GLASS_BLUR_PX * scaleX,
        )
      } else {
        frost.setGlass(null)
      }

      const configuredWidth = Number.parseFloat(
        getComputedStyle(container).getPropertyValue('--ridge-width'),
      )
      const ridgeWidth = Number.isFinite(configuredWidth) ? configuredWidth : 0.8
      // Гребень не должен выходить за прямой участок верхней кромки стекла:
      // дальше начинается скругление, и свет висел в воздухе над углом.
      // На телефоне радиус 24px — заметная доля ширины панели, поэтому
      // одной доли канваса (--ridge-width) мало: ограничиваем в пикселях.
      // Канвас и панель центрированы друг относительно друга.
      const edgeLimit = anchor
        ? (anchor.getBoundingClientRect().width / 2 - GLASS_RADIUS_PX) / (width / 2)
        : ridgeWidth
      program.uniforms.uRidgeWidth.value = Math.min(ridgeWidth, Math.max(edgeLimit, 0.1))
      // Смена размера сбрасывает канвас: остановленному циклу нужен новый кадр.
      loopRef.current?.invalidate()
    }

    const observer = new ResizeObserver(resize)
    observer.observe(canvasHost)
    if (anchorRef.current) observer.observe(anchorRef.current)
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
        frost.render()

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
  }, [anchorRef, revealDurationMs])

  // Внешний блок — световая полоса: по нему считается видимость и гребень на
  // его середине. Канвас внутри длиннее вниз на запас под блюр стекла.
  return (
    <div
      ref={containerRef}
      className="pointer-events-none relative h-full w-full [--ridge-width:0.64] sm:[--ridge-width:0.765] lg:[--ridge-width:0.815]"
    >
      <div
        ref={canvasHostRef}
        className="absolute inset-x-0 top-0 overflow-hidden"
        style={{ bottom: -GLASS_BLEED_PX }}
      />
    </div>
  )
}
