import { useEffect, useRef } from 'react'
import { Color, Mesh, Program, Renderer, RenderTarget, Triangle } from 'ogl'
import { startRenderLoop, type RenderLoop } from './loop'

/**
 * Адаптация React Bits Strands под SpatiumVPN: светящиеся нити + опциональная
 * стеклянная линза (glass) с рефракцией и дисперсией у кромки — «призма».
 * Изменения к оригиналу: общий цикл из loop.ts (в оригинале паузы не было),
 * фрагментный шейдер собирается под конкретные props (см. buildFragment),
 * требуется WebGL2 — иначе фон просто пустой.
 */

const MAX_STRANDS = 12
const MAX_COLORS = 8

const VERT = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`

/** GLSL требует точку в литерале float: 1 → "1.000000". */
const f = (value: number) => (Number.isFinite(value) ? value.toFixed(6) : '0.000000')

const vec3Literal = (hex: string) => {
  const c = new Color(hex)
  return `vec3(${f(c.r)}, ${f(c.g)}, ${f(c.b)})`
}

/**
 * Палитра как цепочка сравнений вместо uniform-массива с динамическим
 * индексом: samplePalette читал uColors[idx] дважды за нить, а динамическая
 * индексация не даёт драйверу держать массив в регистрах.
 */
const buildStrandColor = (colors: string[]) => {
  if (colors.length === 0) {
    return `vec3 strandColor(float t) {
  return 0.5 + 0.5 * cos(2.0 * PI * (t + vec3(0.00, 0.33, 0.67)));
}`
  }
  if (colors.length === 1) {
    return `vec3 strandColor(float t) {
  return ${vec3Literal(colors[0])};
}`
  }

  const stops = colors.map(vec3Literal)
  const branches = stops.map((stop, i) => {
    const next = stops[(i + 1) % stops.length]
    const blend = `scaled - ${f(i)}`
    return i === stops.length - 1
      ? `  return mix(${stop}, ${next}, ${blend});`
      : `  if (scaled < ${f(i + 1)}) return mix(${stop}, ${next}, ${blend});`
  })

  return `vec3 strandColor(float t) {
  float scaled = fract(t) * ${f(stops.length)};
${branches.join('\n')}
}`
}

/**
 * pow() с целой степенью драйвер разворачивает не всегда, а log2/exp2 здесь
 * лишние: цепочка умножений и короче, и точнее.
 */
const buildEnvelope = (taper: number) => {
  const base = 'max(cos(uv.x * PI * 1.3), 0.0)'
  if (!Number.isInteger(taper) || taper < 1 || taper > 4) {
    return `  float env = pow(${base}, ${f(taper)});`
  }
  if (taper === 1) return `  float env = ${base};`
  return `  float envBase = ${base};
  float env = ${Array.from({ length: taper }, () => 'envBase').join(' * ')};`
}

type FragmentConfig = Required<
  Pick<
    StrandsProps,
    | 'colors'
    | 'count'
    | 'speed'
    | 'amplitude'
    | 'waviness'
    | 'thickness'
    | 'glow'
    | 'taper'
    | 'spread'
    | 'hueShift'
    | 'intensity'
    | 'saturation'
    | 'opacity'
    | 'scale'
  >
>

/**
 * Из всех uniform'ов кадр к кадру меняются только uTime и uResolution —
 * остальные заданы props и фиксируются на монтировании. Вшивая их в исходник,
 * мы отдаём компилятору драйвера цикл с константной границей: он сворачивает
 * частоты, фазы и шаг палитры каждой нити в литералы, а ветку saturation и
 * умножения на opacity выкидывает целиком, когда они нейтральны.
 */
const buildFragment = (config: FragmentConfig) => {
  const colors = config.colors.slice(0, MAX_COLORS)
  const count = Math.min(Math.max(Math.round(config.count), 1), MAX_STRANDS)
  const e = 0.06 + config.intensity * 0.94

  const saturation =
    config.saturation === 1
      ? '  col = max(col, 0.0);'
      : `  float gray = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = max(mix(vec3(gray), col, ${f(config.saturation)}), 0.0);`

  const output =
    config.opacity === 1
      ? '  fragColor = vec4(col, clamp(lum, 0.0, 1.0));'
      : `  fragColor = vec4(col * ${f(config.opacity)}, clamp(lum, 0.0, 1.0) * ${f(config.opacity)});`

  return `#version 300 es
precision highp float;

uniform float uTime;
uniform vec2 uResolution;

out vec4 fragColor;

const float PI = 3.14159265;

${buildStrandColor(colors)}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y * ${f(1 / Math.max(config.scale, 0.0001))};

${buildEnvelope(config.taper)}

  // Огибающая обнуляет вклад каждой нити, поэтому за её пределами кадр
  // гарантированно прозрачный. На 16:9 это около трети пикселей, которые
  // иначе прошли бы весь цикл ради нулевого результата.
  if (env <= 0.0) {
    fragColor = vec4(0.0);
    return;
  }

  // Амплитуда, толщина, фаза времени и база оттенка не зависят от номера
  // нити — в оригинале они пересчитывались на каждой итерации.
  float amp = ${f((0.1 + 0.02 * e) * config.amplitude)} * env;
  float thick = ${f((0.001 + 0.05 * e) * config.thickness)} * (0.35 + env);
  float bias = thick * 0.45;
  float tt = uTime * ${f(config.speed)};
  float hue = uv.x * 0.30 + uTime * 0.04 + ${f(config.hueShift)};

  vec3 col = vec3(0.0);

  for (int i = 0; i < ${count}; i++) {
    float fi = float(i);
    float ph = fi * ${f(1.7 * config.spread)};
    float freq = (2.0 + fi * 0.35) * ${f(config.waviness)};
    float spd = 1.4 + fi * 1.2;

    float w = sin(uv.x * freq + tt * spd + ph) * 0.60
            + sin(uv.x * freq * 1.1 - tt * spd * 0.7 + ph * 1.7) * 0.40;

    float d = abs(uv.y - w * amp);
    float g = thick / (d + bias);

    col += strandColor(hue + fi * ${f(1 / count)}) * (g * g);
  }

  // env вынесен из суммы: множитель у всех нитей общий.
  col *= env * ${f(0.45 + 0.7 * e)};
  col = 1.0 - exp(-col * ${f(config.glow)});

${saturation}

  float lum = max(max(col.r, col.g), col.b);
${output}
}
`
}

const GLASS_FRAG = `#version 300 es
precision highp float;

uniform sampler2D uScene;
uniform vec2 uResolution;
uniform float uRadius;
uniform float uRefraction;
uniform float uDispersion;
uniform vec2 uCenter; // центр линзы в долях канваса (0..1, y снизу)

out vec4 fragColor;

vec2 toUv(vec2 p) {
  return p * (uResolution.y / uResolution) + uCenter;
}

void main() {
  vec2 p = (gl_FragCoord.xy - uCenter * uResolution) / uResolution.y;
  float d = length(p);
  float r = uRadius;

  float edge = fwidth(d) * 1.5;
  float mask = 1.0 - smoothstep(r - edge, r + edge, d);
  if (mask <= 0.0) {
    fragColor = vec4(0.0);
    return;
  }

  // sphere height: 0 at the rim, 1 at the center
  float z = sqrt(max(r * r - d * d, 0.0)) / r;
  float nd = d / r;

  // refraction is confined to a narrow band near the rim
  vec2 dir = d > 0.0 ? p / d : vec2(0.0);
  float lens = smoothstep(0.85, 1.0, nd) * pow(nd, 6.0);
  vec2 offset = -dir * lens * uRefraction * 0.15;
  vec2 disp = -dir * lens * uDispersion * 0.012;

  vec3 light;
  light.r = texture(uScene, toUv(p + offset - disp)).r;
  light.g = texture(uScene, toUv(p + offset)).g;
  light.b = texture(uScene, toUv(p + offset + disp)).b;

  // neutral fresnel rim (no color tint so the glass stays clear)
  float fres = pow(1.0 - z, 3.0);
  vec3 rim = vec3(1.0) * fres * 0.18;

  // specular highlight from the upper-left
  vec2 lightDir = normalize(vec2(-0.55, 0.6));
  float spec = pow(max(dot(p / max(r, 1e-4), lightDir), 0.0), 6.0);
  spec *= smoothstep(r, r * 0.55, d);

  vec3 emissive = light + rim + vec3(spec) * 0.4;
  float emissiveA = clamp(max(max(emissive.r, emissive.g), emissive.b), 0.0, 1.0);

  float bodyA = 0.05 + fres * 0.05;

  float outA = emissiveA + bodyA * (1.0 - emissiveA);
  vec3 outRGB = emissive;

  outRGB *= mask;
  outA *= mask;

  fragColor = vec4(outRGB, outA);
}
`

export interface StrandsProps {
  colors?: string[]
  count?: number
  speed?: number
  amplitude?: number
  waviness?: number
  thickness?: number
  glow?: number
  taper?: number
  spread?: number
  hueShift?: number
  intensity?: number
  saturation?: number
  opacity?: number
  scale?: number
  glass?: boolean
  refraction?: number
  dispersion?: number
  glassSize?: number
  /** Центр линзы в долях ширины/высоты от левого верхнего угла (default 0.5/0.5) */
  glassCenter?: [number, number]
  /** Фиксированный момент в секундах: один кадр вместо постоянного rAF-цикла. */
  staticTime?: number
  /** Верхняя граница DPR. Для мягкого фонового света 1–1.5 обычно достаточно. */
  dpr?: number
  /** Нужен только экспортёру, который читает пиксели после отрисовки. */
  preserveDrawingBuffer?: boolean
  className?: string
}

export default function Strands({
  colors = ['#c1dbff', '#426eff', '#ffffff'],
  count = 5,
  speed = 0.5,
  amplitude = 0.5,
  waviness = 1,
  thickness = 0.7,
  glow = 2,
  taper = 3,
  spread = 1,
  hueShift = 0,
  intensity = 0.5,
  saturation = 1,
  opacity = 1,
  scale = 1.5,
  glass = false,
  refraction = 1,
  dispersion = 1,
  glassSize = 1,
  glassCenter = [0.5, 0.5],
  staticTime,
  dpr = 2,
  preserveDrawingBuffer = false,
  className = '',
}: StrandsProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const renderer = new Renderer({
      dpr: Math.min(window.devicePixelRatio, dpr),
      alpha: true,
      premultipliedAlpha: true,
      // Полноэкранный треугольник не имеет видимых геометрических рёбер —
      // MSAA здесь расходует память, но не улучшает изображение.
      antialias: false,
      // Сцена — один проход без глубины. Иначе OGL заводит depth-буфер
      // размером с канвас и очищает его каждый кадр.
      depth: false,
      // Декоративный фон не повод будить дискретную видеокарту.
      powerPreference: 'low-power',
      // Только export-режиму нужно читать пиксели после завершения кадра.
      preserveDrawingBuffer,
    })
    const gl = renderer.gl
    if (!('drawBuffers' in gl)) return // шейдеры требуют WebGL2
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
      fragment: buildFragment({
        colors,
        count,
        speed,
        amplitude,
        waviness,
        thickness,
        glow,
        taper,
        spread,
        hueShift,
        intensity,
        saturation,
        opacity,
        scale,
      }),
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: [1, 1] },
      },
      depthTest: false,
      depthWrite: false,
    })
    const mesh = new Mesh(gl, { geometry, program })

    // Раньше framebuffer и второй шейдер создавались даже при glass=false.
    // Для Bypass это была чистая цена на входе без единого использованного кадра.
    const renderTarget = glass ? new RenderTarget(gl, { width: 1, height: 1 }) : null
    const glassProgram = renderTarget
      ? new Program(gl, {
          vertex: VERT,
          fragment: GLASS_FRAG,
          uniforms: {
            uScene: { value: renderTarget.texture },
            uResolution: { value: [1, 1] },
            uRadius: { value: 0.46 * glassSize },
            uRefraction: { value: refraction },
            uDispersion: { value: dispersion },
            uCenter: { value: [glassCenter[0], 1 - glassCenter[1]] },
          },
          depthTest: false,
          depthWrite: false,
        })
      : null
    const glassMesh = glassProgram ? new Mesh(gl, { geometry, program: glassProgram }) : null

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = container
      renderer.setSize(w, h)
      // gl_FragCoord — в физических пикселях: uResolution обязан совпадать
      // с drawing buffer, иначе при dpr>1 линза уезжает из центра
      const pw = gl.canvas.width
      const ph = gl.canvas.height
      program.uniforms.uResolution.value = [pw, ph]
      renderTarget?.setSize(pw, ph)
      if (glassProgram) glassProgram.uniforms.uResolution.value = [pw, ph]
    }
    let loop: RenderLoop | null = null
    const ro = new ResizeObserver(() => {
      resize()
      loop?.invalidate()
    })
    ro.observe(container)
    resize()

    const renderFrame = (timeSeconds: number) => {
      program.uniforms.uTime.value = timeSeconds
      if (renderTarget && glassProgram && glassMesh) {
        renderer.render({ scene: mesh, target: renderTarget })
        glassProgram.uniforms.uScene.value = renderTarget.texture
        renderer.render({ scene: glassMesh })
      } else {
        renderer.render({ scene: mesh })
      }
    }

    let staticRaf = 0
    if (staticTime === undefined) {
      // Нити дрейфуют медленно: самая быстрая проходит период примерно за три
      // секунды. Выше 60 кадров разницы не видно, а стоимость кадра линейна.
      loop = startRenderLoop(container, (t) => renderFrame(t * 0.001), { fps: 60 })
    } else {
      // ResizeObserver отрабатывает асинхронно. Следующий rAF гарантирует,
      // что canvas уже получил итоговый размер перед единственным кадром.
      staticRaf = requestAnimationFrame(() => {
        resize()
        renderFrame(staticTime)
        // Синхронная GPU-остановка нужна только скрипту экспорта. В обычной
        // странице команда может завершиться асинхронно и не блокировать reveal.
        if (preserveDrawingBuffer) gl.finish()
        gl.canvas.dataset.strandsReady = 'true'
      })
    }

    return () => {
      loop?.stop()
      cancelAnimationFrame(staticRaf)
      ro.disconnect()
      gl.getExtension('WEBGL_lose_context')?.loseContext()
      gl.canvas.remove()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- фон монтируется один раз
  }, [])

  return (
    <div
      ref={containerRef}
      className={`pointer-events-none relative h-full w-full overflow-hidden ${className}`}
    />
  )
}
