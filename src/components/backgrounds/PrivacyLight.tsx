import { useEffect, useRef, type RefObject } from 'react'
import { Mesh, Program, Renderer, Triangle } from 'ogl'
import { createFrostedLight } from './frostedLight'
import { startRenderLoop, type RenderLoop } from './loop'
import { LIGHT_REVEAL_DELAY_MS, LIGHT_REVEAL_DURATION_MS } from './lightMotion'

// Дальше этого расстояния от панели хвост луча доведён до нуля: на десктопе
// он гаснет у левого края экрана, а не обрывается им.
const BEAM_LENGTH_PX = 600

/**
 * Яркость точки пересечения нитей. 1 — как в макете; меньше — перекрестье
 * мягче и белый клин короче, больше — ярче и шире. Влияет только на область
 * в ~100 px вокруг удара, лучи вдали остаются прежними.
 */
const CROSSING_INTENSITY = 0.77
/**
 * Длина ореола вертикальных нитей от точки удара в каждую сторону, в долях
 * высоты панели. Тонкое ядро от неё не зависит: оно всегда тянется до
 * скругления углов (VERTICAL_CORE_TAPER в шейдере). За скруглённые углы
 * контейнера свечение не выходит при любом значении (uEdgeExtent).
 */
const VERTICAL_LENGTH = 0.53
/**
 * Длина затухания ореола вертикали у концов прямой кромки, в долях её длины
 * от точки удара. Меньше — ореол держится почти до угла и гаснет резче,
 * больше — гаснет раньше и мягче. На ядро не влияет.
 */
const EDGE_FADE = 0.5

/** Размытие света под стеклом панели, CSS px — прежний backdrop-filter: blur(48px). */
const GLASS_BLUR_PX = 96
/** Скругление панели (.privacy-shell). */
const GLASS_RADIUS_PX = 24

const VERT = `#version 300 es
in vec2 position;

void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`

const FRAG = `#version 300 es
precision highp float;

uniform float uReveal;
// Длина луча и высота панели — в единицах профиля: CSS px / uProfileScale.
uniform float uBeamLength;
uniform float uPanelHeight;
// Где кончается прямой участок кромки стекла — над и под точкой удара, до
// начала скругления углов. Тоже в единицах профиля.
uniform vec2 uEdgeExtent;
// Пикселей канваса в единице профиля: dpr канваса × uProfileScale.
uniform float uScale;
uniform vec2 uImpact;
uniform vec2 uResolution;
// Доля горизонтального луча: 1 — луч прилетает слева, 0 — только свет кромки.
uniform float uBeam;

out vec4 fragColor;

// Прежде яркость дышала как 0.988 + sin(uTime * 0.34) * 0.012 — колебание в
// 1.2% с периодом 18 секунд. На глаз оно неразличимо, но заставляло шейдер
// считаться вечно. Константа равна середине этого колебания.
const float breathe = 0.988;
const float HALF_PI = 1.5707963;

// Экспозиция по каналам, как у Strands: 1 - exp(-E × tint). Синий набирается
// быстрее красного — слабый свет холодно-стальной, сильный выгорает в белый.
// Цвет и все параметры нитей ниже сняты с макета в Figma по пикселям.
const vec3 tint = vec3(0.592, 0.705, 1.0);

// Тонкое яркое ядро нитей подобрано по контуру белого клина у панели в
// макете: белое тянется влево ~200 px, плавно сужаясь, и вдоль кромки
// ~90 px в каждую сторону. Ядро горизонтали гаснет быстрее тела нити (свой
// гаусс), поэтому дальше луч — мягкая холодная линия, а не белая нить.
const float HORIZONTAL_CORE_SIGMA = 99.3;
const float HORIZONTAL_CORE_THICKNESS = 3.97;
const float HORIZONTAL_CORE_GAIN = 13.19;
const float VERTICAL_CORE_THICKNESS = 2.61;
const float VERTICAL_CORE_GAIN = 1.112;
// Тело вертикальных нитей. Шире горизонтали: вдали от перекрестья вдоль
// кромки остаётся мягкое размытое свечение, а не тонкая линия.
const float VERTICAL_THICKNESS = 46.0;
// Затухание ядра вертикали к концам прямой кромки. Больше — тусклеет раньше,
// меньше — яркая нить держится ближе к углам. Подобрано по гребню Bypass.
const float VERTICAL_CORE_TAPER = 2.2;
// Цвет ядра вертикали. Почти нейтральный: тусклый хвост ядра у краёв
// контейнера светлый, как у гребня Bypass, а не синий.
const vec3 coreTint = vec3(0.8, 0.86, 1.0);

const float CROSSING_INTENSITY = ${CROSSING_INTENSITY.toFixed(3)};
const float VERTICAL_LENGTH = ${VERTICAL_LENGTH.toFixed(3)};
const float EDGE_FADE = ${EDGE_FADE.toFixed(3)};

float easeOut(float t) {
  return 1.0 - pow(1.0 - clamp(t, 0.0, 1.0), 3.0);
}

// Прямая нить Strands поперёк расстояния d: (t / (d + 0.45t))², толщина
// t = thickness × (0.35 + env), яркость × env. Хвосты 1/d² и дают ощущение
// источника света. env — taper вдоль нити: к концам она и тусклее, и тоньше,
// поэтому каждый луч звезды сходится в острие.
float strandProfile(float d, float t) {
  float g = t / (d + 0.45 * t);
  return g * g;
}

float strandExposure(float d, float env, float thickness, float gain) {
  return gain * env * strandProfile(d, thickness * (0.35 + env));
}

// Слой Strands после собственного тонмапа — то, что Figma складывает через
// Plus lighter.
vec3 strandLayer(float exposure) {
  return 1.0 - exp(-exposure * tint);
}

void main() {
  // Все слагаемые экспозиции проходят через beamIgnition, handoff или
  // arrivalPulse, и каждый из них равен нулю при uReveal = 0.
  if (uReveal <= 0.0) {
    fragColor = vec4(0.0);
    return;
  }

  vec2 impact = vec2(uImpact.x, uResolution.y - uImpact.y);
  // Точка относительно места удара о край панели, в единицах профиля.
  vec2 p = (gl_FragCoord.xy - impact) / uScale;
  float leftDistance = max(-p.x, 0.0);
  float rightDistance = max(p.x, 0.0);
  float crossDistance = abs(p.x);
  float verticalDistance = abs(p.y);

  // Taper горизонтальной нити — гаусс с центром в месте удара. К концу луча
  // он доводится до нуля, чтобы хвост не обрывался краем экрана.
  float beamEnvelope = exp(-0.5 * pow(leftDistance / 261.0, 2.0))
    * (1.0 - smoothstep(uBeamLength * 0.55, uBeamLength, leftDistance));

  // Contact is the exact endpoint of travel. Only then can the beam broaden
  // and the panel light up; the final field is never revealed by a moving mask.
  float reveal = clamp(uReveal, 0.0, 1.0);
  const float contactTime = 0.38;
  float travel = clamp(reveal / contactTime, 0.0, 1.0);
  // Accelerate into the edge instead of drifting at almost constant speed.
  float headX = mix(-uBeamLength, 0.0, pow(travel, 2.8));
  float contact = clamp((reveal - contactTime) / (1.0 - contactTime), 0.0, 1.0);
  float pressure = easeOut(contact);
  // The core responds first; the atmosphere follows with a slower release.
  float bloom = easeOut(clamp((contact - 0.08) / 0.92, 0.0, 1.0));
  float handoff = smoothstep(0.0, 0.12, contact);
  float beamIgnition = smoothstep(0.0, 0.08, reveal);

  // A rounded, narrow tip leads a continuous cold-white trail. Its distance
  // field follows the head, not the eventual broad silhouette at the panel.
  float tipDistance = length(vec2(max(p.x - headX, 0.0), verticalDistance));
  float tipCore = 1.6 / (tipDistance + 0.72);
  float tipHalo = 9.0 / (tipDistance + 9.0);
  float flight = (tipCore * tipCore * 1.2 + tipHalo * tipHalo * 0.5)
    * beamEnvelope * beamIgnition * (1.0 - handoff) * uBeam;

  // Свет собран как в макете: три прямые нити Strands — одна горизонтальная
  // и две вертикальные вдоль кромки стекла. Каждая нить проходит свой тонмап,
  // а слои складываются уже готовым цветом (Plus lighter). Поэтому там, где
  // нити перекрываются, свет сливается в единую звезду-крест, а не в две
  // наложенные палки, и синий у перехода насыщается сам, без отдельного ободка.
  // Широкое тело нити и её тонкое яркое ядро.
  float grow = mix(0.3, 1.0, pressure);
  float coreEnvelope = exp(-0.5 * pow(leftDistance / HORIZONTAL_CORE_SIGMA, 2.0));
  float beam = (strandExposure(verticalDistance, beamEnvelope, 37.0 * grow, 0.557)
      + strandExposure(verticalDistance, coreEnvelope, HORIZONTAL_CORE_THICKNESS * grow,
        HORIZONTAL_CORE_GAIN * pow(coreEnvelope, 0.342)))
    * exp(-rightDistance / 40.0)
    * handoff * uBeam;

  // Вертикальные нити короче и с острым taper (cos²·¹) на 231 px от удара.
  float ridgeAxis = p.y / max(uPanelHeight * 0.5, 1.0);
  float ridgeLength = max(uPanelHeight * VERTICAL_LENGTH, 1.0);
  // Вертикаль гаснет к концам прямой кромки, сколько бы ни была длинной
  // сама нить: за скруглённый угол контейнера свечение не выходит.
  float edgeEnd = p.y > 0.0 ? uEdgeExtent.x : uEdgeExtent.y;
  float edgeFade = 1.0 - smoothstep(edgeEnd * (1.0 - EDGE_FADE), edgeEnd, verticalDistance);
  float ridgeEnvelope = pow(cos(HALF_PI * clamp(verticalDistance / ridgeLength, 0.0, 1.0)), 2.1)
    * edgeFade;
  float ridgeHalo = strandExposure(crossDistance, ridgeEnvelope,
    VERTICAL_THICKNESS * mix(0.3, 1.0, bloom), 0.187);
  // Ядро вертикали устроено как гребень Bypass: ореол к краям контейнера
  // уходит первым, а ядро не истончается вместе с ним и тянется почти до
  // скругления углов, плавно тускнея по (1 - x²)^VERTICAL_CORE_TAPER. Свет
  // кончается тонкой светлой нитью, а не обрезом размытого пятна.
  float edgeAxis = clamp(verticalDistance / max(edgeEnd, 1.0), 0.0, 1.0);
  float coreTaper = pow(1.0 - edgeAxis * edgeAxis, VERTICAL_CORE_TAPER);
  float ridgeCore = VERTICAL_CORE_GAIN * coreTaper * strandProfile(crossDistance,
    VERTICAL_CORE_THICKNESS * (0.35 + max(ridgeEnvelope, 0.65)) * grow);

  // Diffusion starts at contact and spreads in both directions along the edge.
  float ridgeSettle = smoothstep(0.45, 1.0, contact);
  float diffusionWidth = mix(0.025, 0.82, bloom);
  float ridgeDiffusion = exp(-pow(abs(ridgeAxis) / max(diffusionWidth, 0.001), 1.45));
  float ridgeField = mix(ridgeDiffusion, 1.0, ridgeSettle) * handoff;

  // A localized, restrained flash rises after impact and settles to zero.
  float arrivalPulse = smoothstep(0.0, 0.06, contact)
    * (1.0 - smoothstep(0.06, 0.55, contact));
  float source = (exp(-crossDistance * 0.42) * exp(-verticalDistance * 0.05) * 2.4
    + exp(-crossDistance * 0.065) * exp(-verticalDistance * 0.016) * 0.4)
    * arrivalPulse;

  // Регулятор яркости перекрестья: гауссово пятно ~70 px вокруг удара.
  float crossing = mix(1.0, CROSSING_INTENSITY,
    exp(-0.5 * dot(p, p) / (70.0 * 70.0)));
  beam *= crossing;

  vec3 horizontal = strandLayer((flight + beam) * breathe);
  // Вспышка прибавляется к паре вертикальных нитей, поэтому берётся вполовину.
  vec3 vertical = 1.0 - exp(-((ridgeHalo * tint + ridgeCore * coreTint) * crossing * ridgeField
    + source * 0.5 * tint) * breathe);
  vec3 col = min(horizontal + 2.0 * vertical, 1.0);

  float alpha = clamp(max(max(col.r, col.g), col.b), 0.0, 1.0);
  fragColor = vec4(col, alpha);
}
`

interface PrivacyLightProps {
  active: boolean
  anchorRef: RefObject<HTMLElement | null>
}

/**
 * A fullscreen light field aligned to the Privacy panel's left edge. The
 * travelling ray and vertical ridge are one event: arrival energy becomes an
 * Ice-Ridge-style diffusion along the glass boundary.
 *
 * Кадр зависит только от uReveal и геометрии панели, поэтому после вступления
 * цикл останавливается — до следующего resize или смены active.
 *
 * Часть света, ушедшую под стекло панели, канвас выводит уже размытой
 * (frostedLight) — вместо backdrop-filter на самой панели, который повторял
 * бы тот же блюр на каждом кадре скролла.
 */
export default function PrivacyLight({ active, anchorRef }: PrivacyLightProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef(active)
  const revealStartRef = useRef<number | null>(null)
  const loopRef = useRef<RenderLoop | null>(null)

  useEffect(() => {
    revealStartRef.current = active ? performance.now() + LIGHT_REVEAL_DELAY_MS : null
  }, [active])

  useEffect(() => {
    activeRef.current = active
    loopRef.current?.invalidate()
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
        uBeamLength: { value: BEAM_LENGTH_PX },
        uPanelHeight: { value: 1 },
        uEdgeExtent: { value: [1, 1] },
        uScale: { value: 1 },
        uImpact: { value: [1, 1] },
        uResolution: { value: [1, 1] },
        uBeam: { value: 1 },
      },
      transparent: true,
      depthTest: false,
      depthWrite: false,
    })
    const mesh = new Mesh(gl, { geometry, program })
    const frost = createFrostedLight(gl, renderer, mesh)

    const resize = () => {
      const width = container.clientWidth
      const height = container.clientHeight
      const anchor = anchorRef.current
      if (width === 0 || height === 0 || !anchor) return

      renderer.setSize(width, height)
      const containerRect = container.getBoundingClientRect()
      const anchorRect = anchor.getBoundingClientRect()
      const scaleX = gl.canvas.width / width
      const scaleY = gl.canvas.height / height
      const compact = window.matchMedia('(max-width: 1023px)').matches
      const profileScale = compact ? 0.5 : 1
      const impactX = anchorRect.left - containerRect.left
      // Лучу нужен разбег слева от панели. На телефоне до края экрана ~20px:
      // от луча оставался обрубок-вспышка у самой кромки экрана. Там свет
      // зажигается прямо на кромке стекла, без прилёта.
      program.uniforms.uBeam.value = impactX >= 120 ? 1 : 0
      const impactY = anchorRect.top - containerRect.top + anchorRect.height * 0.515

      program.uniforms.uResolution.value = [gl.canvas.width, gl.canvas.height]
      program.uniforms.uScale.value = scaleX * profileScale
      program.uniforms.uBeamLength.value = BEAM_LENGTH_PX / profileScale
      program.uniforms.uPanelHeight.value = anchorRect.height / profileScale
      // Прямой участок кромки: от удара до верхнего и нижнего края панели
      // за вычетом скругления. x — вверх (gl_FragCoord растёт вверх), y — вниз.
      const impactOffset = impactY - (anchorRect.top - containerRect.top)
      program.uniforms.uEdgeExtent.value = [
        Math.max(impactOffset - GLASS_RADIUS_PX, 1) / profileScale,
        Math.max(anchorRect.height - impactOffset - GLASS_RADIUS_PX, 1) / profileScale,
      ]
      program.uniforms.uImpact.value = [impactX * scaleX, impactY * scaleY]

      frost.setSize(gl.canvas.width, gl.canvas.height)
      frost.setGlass(
        {
          left: impactX * scaleX,
          top: (anchorRect.top - containerRect.top) * scaleY,
          width: anchorRect.width * scaleX,
          height: anchorRect.height * scaleY,
        },
        GLASS_RADIUS_PX * scaleX,
        GLASS_BLUR_PX * scaleX,
      )
      // Кадр остановленного цикла остаётся от прежней геометрии и размера
      // канваса — после resize его нужно перерисовать.
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
        frost.render()

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
