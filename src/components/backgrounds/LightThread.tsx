import { useEffect, useRef, type RefObject } from 'react'
import { Mesh, Program, Renderer, Triangle } from 'ogl'
import { startRenderLoop, type RenderLoop } from './loop'
import { LIGHT_PALETTE_GLSL } from './lightPalette'

/**
 * Световая нить секции отзывов — «S» на двух касающихся окружностях: из-под
 * левого края она огибает верх левой окружности над верхней лентой, в точке
 * касания проходит сквозь обе ленты и огибает низ правой окружности под
 * нижней лентой, поднимаясь к правому краю.
 *
 * Всё задано в высотах карточки: x — от центра секции, y — от верхней
 * кромки первой ленты (вторая лента начинается на ~1.11). Так окружности
 * остаются окружностями на любой ширине и стоят на тех же местах
 * относительно лент.
 */
const S_RADIUS = 1.36
/** Центры окружностей: по бокам от центра секции, касаются друг друга. */
const S_CENTER_Y = 1.02
/** На сколько радиан нить продолжается за горизонтальный диаметр на концах. */
const S_OVERSHOOT = 0.1

/**
 * Профиль нити — как у Strands в Hero, эталона всей графики лендинга.
 * Интенсивность — то же, что проп intensity у Strands (0..1): от неё зависит
 * яркость нити до экспозиции. В Hero — 0.55, но там пять нитей и они
 * складываются; одной нити поверх карточек хватает меньшего.
 */
const THREAD_INTENSITY = 0.2
/**
 * Толщина нити в CSS px — t в профиле Strands (t / (d + 0.45t))², у самой
 * яркой части нити умножается на 1.35. В Hero — ~26 px.
 */
const THREAD_THICKNESS = 16
/** Экспозиция, как glow у Strands в Hero. */
const THREAD_GLOW = 2

/** Число отрезков ломаной, которой шейдер приближает нить. */
const SEGMENTS = 160

type ThreadPoint = { x: number; y: number }

function sShape(count: number): ThreadPoint[] {
  const r = S_RADIUS
  const span = Math.PI + S_OVERSHOOT
  const out: ThreadPoint[] = []
  for (let i = 0; i < count; i++) {
    const t = (i / (count - 1)) * 2
    // y экрана растёт вниз, поэтому верх окружности — минус sin.
    const angle = t <= 1 ? Math.PI + S_OVERSHOOT - t * span : Math.PI + (t - 1) * span
    const cx = t <= 1 ? -r : r
    out.push({ x: cx + r * Math.cos(angle), y: S_CENTER_Y - r * Math.sin(angle) })
  }
  return out
}

/**
 * Taper вдоль нити по нормированной длине дуги: концы, спрятанные под
 * карточками, тоньше и тусклее — как дуга горизонта к краям.
 */
function threadEnvelope(arc: number) {
  return Math.pow(Math.max(Math.sin(arc * Math.PI), 0), 0.85)
}

const VERT = `#version 300 es
in vec2 position;

void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`

const FRAG = `#version 300 es
precision highp float;

#define POINTS ${SEGMENTS + 1}

// Ломаная нити в пикселях канваса (y снизу вверх, как gl_FragCoord) и
// нормированная длина дуги до каждой вершины.
uniform vec2 uPath[POINTS];
uniform float uArc[POINTS];
// Taper нити в каждой вершине: форма задаёт его сама (threadEnvelope).
uniform float uEnv[POINTS];
// Ряды карточек по вертикали (y0, y1 нижней и верхней границы в пикселях
// канваса, снизу вверх), ширина краевых шторок лент и мягкость их края.
uniform vec4 uBands;
uniform float uFeather;
uniform float uShutter;
uniform float uWidth;
// Толщина нити в пикселях канваса.
uniform float uThickness;

out vec4 fragColor;

const float PI = 3.14159265;
${LIGHT_PALETTE_GLSL}

// Доля внешнего ореола: прежние 0.24 × 0.4 × 2.75 (ореол × яркость ×
// экспозиция), пересчитанные на нормировку и экспозицию Strands ниже.
const float HALO_GAIN = ${(
  (0.24 * 0.4 * 2.75) /
  ((0.45 + 0.7 * (0.06 + THREAD_INTENSITY * 0.94)) * THREAD_GLOW)
).toFixed(4)};

// Палитра нитей Strands (LANDING_STRAND_COLORS): pale → electric → ice.
vec3 sampleStrandPalette(float t) {
  float scaled = fract(t) * 3.0;

  if (scaled < 1.0) return mix(paleBlue, electricBlue, scaled);
  if (scaled < 2.0) return mix(electricBlue, iceWhite, scaled - 1.0);
  return mix(iceWhite, paleBlue, scaled - 2.0);
}

// Непрозрачность чёрной шторки ленты (.testimonial-marquee::before) на доле
// e её ширины от края экрана — те же опорные точки, что у CSS-градиента.
float shutterAlpha(float e) {
  if (e >= 1.0) return 0.0;
  if (e < 0.18) return mix(1.0, 0.96, e / 0.18);
  if (e < 0.42) return mix(0.96, 0.78, (e - 0.18) / 0.24);
  if (e < 0.72) return mix(0.78, 0.34, (e - 0.42) / 0.3);
  return mix(0.34, 0.0, (e - 0.72) / 0.28);
}

// Маска шторки ряда карточек [bottom, top] (пиксели канваса, снизу вверх):
// 1 в высоту карточек, линейно до 0 на uFeather за их пределами.
float shutterCoverage(float y, vec2 row) {
  float outside = max(row.x - y, y - row.y);
  return clamp(1.0 - outside / max(uFeather, 1e-3), 0.0, 1.0);
}

// Свет отрезка [s0, s1] нити на расстоянии d² от её прямой. Каждая точка
// нити светит как источник A / (r² + c²)^(3/2); интеграл вдоль бесконечной
// прямой даёт t² / (d² + c²). Свет отрезков складывается, поэтому там, где
// нити пересекаются, они просто суммируются. Прежде бралось расстояние до
// ближайшей точки нити, и на биссектрисах перекрестья, где ближайшей
// становилась другая ветвь, свечение ломалось складками.
float lineGlow(float s0, float s1, float d2, float t, float c) {
  float q2 = d2 + c * c;
  return 0.5 * t * t / q2 * (s1 * inversesqrt(s1 * s1 + q2) - s0 * inversesqrt(s0 * s0 + q2));
}

// Профиль нити Strands (t / (d + 0.45t))² — острое белое ядро и хвост t²/d²
// — собран из трёх слагаемых t² / (d² + c²). Веса и c подобраны так, что у
// прямой нити профиль совпадает со Strands в пределах 7% от ядра до хвоста.
float strandGlow(float s0, float s1, float d2, float t) {
  return 0.0309 * lineGlow(s0, s1, d2, t, 0.1 * t)
    + 0.5289 * lineGlow(s0, s1, d2, t, 0.55 * t)
    + 0.4401 * lineGlow(s0, s1, d2, t, 3.0 * t);
}

// Внешний ореол — как у дуги горизонта (OrbitalHorizon), профиль
// (t / (d + 0.72t))², собранный из двух слагаемых t² / (d² + c²).
float outerGlowProfile(float s0, float s1, float d2, float t) {
  return 0.15 * lineGlow(s0, s1, d2, t, 0.3 * t) + 0.85 * lineGlow(s0, s1, d2, t, 1.8 * t);
}

void main() {
  vec2 frag = gl_FragCoord.xy;

  vec3 color = vec3(0.0);
  for (int i = 0; i < POINTS - 1; i++) {
    float envelope = 0.5 * (uEnv[i] + uEnv[i + 1]);
    if (envelope <= 0.0) continue;

    vec2 a = uPath[i];
    vec2 ab = uPath[i + 1] - a;
    float len = length(ab);
    if (len < 1e-3) continue;
    vec2 dir = ab / len;
    vec2 ap = frag - a;
    float along = dot(ap, dir);
    float across = ap.x * dir.y - ap.y * dir.x;
    float d2 = across * across;
    float s0 = -along;
    float s1 = len - along;

    // Как у Strands: taper сужает нить к концам, (0.35 + env), и гасит её.
    float strand = strandGlow(s0, s1, d2, uThickness * (0.35 + envelope));

    float arc = 0.5 * (uArc[i] + uArc[i + 1]);
    color += sampleStrandPalette(0.665 - abs(arc - 0.5) * 0.36) * strand * envelope;

    // Холодный внешний ореол дуги горизонта: толщина в пикселях канваса, как
    // там. Доля подобрана так, что после экспозиции ниже ореол такой же, как
    // был у нити до перехода на профиль Strands.
    float haloThickness = 7.2 * (0.74 + envelope * 1.56) * (3.1 + envelope * 3.1);
    color += mix(haloShadow, haloBlue, envelope)
      * outerGlowProfile(s0, s1, d2, haloThickness) * envelope * HALO_GAIN;
  }

  // Нормировка и экспозиция Strands: col *= 0.45 + 0.7e, 1 - exp(-col * glow).
  color *= ${(0.45 + 0.7 * (0.06 + THREAD_INTENSITY * 0.94)).toFixed(4)};
  color = 1.0 - exp(-color * ${THREAD_GLOW.toFixed(4)});

  // Шторки лент затемняют у краёв экрана карточки и свет под ними, но
  // только в высоту карточек и с мягким краем на uFeather (index.css,
  // .testimonial-marquee::before). Шейдер добирает затемнение до полного
  // везде, где шторки нет или она неполная: CSS даёт 1 - a·m, шейдер —
  // (1 - a) / (1 - a·m), вместе ровно 1 - a. Иначе у краёв на свечении
  // оставались бы горизонтальные кромки.
  float edge = min(frag.x, uWidth - frag.x) / max(uShutter, 1.0);
  float shutter = shutterAlpha(edge);
  if (shutter > 0.0) {
    float coverage = max(shutterCoverage(frag.y, uBands.xy), shutterCoverage(frag.y, uBands.zw));
    if (coverage < 1.0) {
      color *= (1.0 - shutter) / max(1.0 - shutter * coverage, 1e-4);
    }
  }

  float alpha = clamp(max(max(color.r, color.g), color.b), 0.0, 1.0);
  fragColor = vec4(color, alpha);
}
`

interface LightThreadProps {
  /** Лента отзывов: по первой карточке внутри берётся верх ленты и её высота. */
  anchorRef: RefObject<HTMLElement | null>
}

/**
 * Статичный кадр: рисуется один раз и после resize. Свет лежит под
 * карточками — их матовое стекло (backdrop-filter) размывает нить само.
 */
export default function LightThread({ anchorRef }: LightThreadProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const loopRef = useRef<RenderLoop | null>(null)

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
    gl.canvas.style.width = '100%'
    gl.canvas.style.height = '100%'
    container.appendChild(gl.canvas)

    const geometry = new Triangle(gl)
    if (geometry.attributes.uv) delete geometry.attributes.uv

    const program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms: {
        // Обычные массивы, не Float32Array: ogl сопоставляет юниформ-массив
        // uPath[0] со значением только через Array.isArray.
        uPath: { value: new Array<number>((SEGMENTS + 1) * 2).fill(0) },
        uArc: { value: new Array<number>(SEGMENTS + 1).fill(0) },
        uEnv: { value: new Array<number>(SEGMENTS + 1).fill(0) },
        uBands: { value: [0, 0, 0, 0] },
        uShutter: { value: 0 },
        uWidth: { value: 1 },
        uThickness: { value: THREAD_THICKNESS },
        uFeather: { value: 1 },
      },
      depthTest: false,
      depthWrite: false,
    })
    const mesh = new Mesh(gl, { geometry, program })

    const resize = () => {
      const width = container.clientWidth
      const height = container.clientHeight
      const card = anchorRef.current?.querySelector('.testimonial-card')
      if (width === 0 || height === 0 || !card) return

      renderer.setSize(width, height)
      const scale = gl.canvas.width / width
      const containerRect = container.getBoundingClientRect()
      const cardRect = card.getBoundingClientRect()
      const rowTop = cardRect.top - containerRect.top
      const cardHeight = cardRect.height

      program.uniforms.uThickness.value = THREAD_THICKNESS * scale

      const samples = sShape(SEGMENTS + 1)
      const path = program.uniforms.uPath.value as number[]
      const arc = program.uniforms.uArc.value as number[]
      const env = program.uniforms.uEnv.value as number[]
      let total = 0
      samples.forEach(({ x: u, y: v }, i) => {
        const x = (width / 2 + u * cardHeight) * scale
        const y = (height - (rowTop + v * cardHeight)) * scale
        if (i > 0) total += Math.hypot(x - path[i * 2 - 2], y - path[i * 2 - 1])
        path[i * 2] = x
        path[i * 2 + 1] = y
        arc[i] = total
      })
      for (let i = 0; i < arc.length; i++) {
        arc[i] /= Math.max(total, 1)
        env[i] = threadEnvelope(arc[i])
      }

      // Ряды карточек (лента без запаса под ореол — там лежат шторки) и
      // ширина шторок — из вёрстки, чтобы свет вне рядов гас к краям ровно
      // так же, как под шторками.
      const rows = Array.from(
        anchorRef.current?.querySelectorAll<HTMLElement>('.testimonial-marquee') ?? [],
      )
      const toGl = (y: number) => (height - (y - containerRect.top)) * scale
      const bands = [0, 0, 0, 0]
      rows.slice(0, 2).forEach((row, i) => {
        const rect = row.getBoundingClientRect()
        const pad = Number.parseFloat(getComputedStyle(row).paddingTop) || 0
        bands[i * 2] = toGl(rect.bottom - pad)
        bands[i * 2 + 1] = toGl(rect.top + pad)
      })
      program.uniforms.uBands.value = bands
      program.uniforms.uShutter.value = rows[0]
        ? Number.parseFloat(getComputedStyle(rows[0], '::before').width) * scale || 0
        : 0
      program.uniforms.uWidth.value = gl.canvas.width
      program.uniforms.uFeather.value = rows[0]
        ? (Number.parseFloat(
            getComputedStyle(rows[0]).getPropertyValue('--testimonial-shutter-feather'),
          ) || 0) * scale
        : 0
      loopRef.current?.invalidate()
    }

    const observer = new ResizeObserver(resize)
    observer.observe(container)
    if (anchorRef.current) observer.observe(anchorRef.current)
    resize()

    const loop = startRenderLoop(
      container,
      () => {
        renderer.render({ scene: mesh })
        return false
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
  }, [anchorRef])

  return <div ref={containerRef} className="h-full w-full" />
}
