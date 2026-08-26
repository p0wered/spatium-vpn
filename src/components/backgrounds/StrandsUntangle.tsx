import { useEffect, useRef } from 'react'
import { Color, Mesh, Program, Renderer, Triangle } from 'ogl'
import { startRenderLoop } from './loop'

/**
 * Сцена «Расплетание» для Bypass: форк Strands, материал света не тронут
 * (обратноквадратичное ядро, тональная компрессия `1-exp`, палитра),
 * изменена только геометрия нитей. Слева нити спутаны и обесцвечены —
 * «зафильтрованный» трафик; по `active` фронт проходит поле слева направо
 * и за ним нити расплетаются в спокойные волны, как в Hero.
 *
 * Урок PrismField (снят 23.08.2026, см. PROJECT.md): рисованная с нуля
 * аналитическая графика проигрывает откалиброванному движку — поэтому здесь
 * ни одного нового приёма материала, только другая траектория нитей.
 * Требуется WebGL2 — иначе сцена просто пустая.
 */

const MAX_STRANDS = 12
const MAX_COLORS = 8

/** Длительность прохода фронта; чипы транспортов в Bypass приходят на 2480 мс. */
const FRONT_MS = 2400

const VERT = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`

const FRAG = `#version 300 es
precision highp float;

uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uColors[${MAX_COLORS}];
uniform int uColorCount;
uniform int uStrandCount;
uniform float uSpeed;
uniform float uAmplitude;
uniform float uWaviness;
uniform float uThickness;
uniform float uGlow;
uniform float uTaper;
uniform float uSpread;
uniform float uHueShift;
uniform float uIntensity;
uniform float uOpacity;
uniform float uScale;
uniform float uSaturation;
uniform float uFront; // 0 — всё спутано, 1 — всё расплетено

out vec4 fragColor;

const float PI = 3.14159265;

vec3 spectrum(float t) {
  return 0.5 + 0.5 * cos(2.0 * PI * (t + vec3(0.00, 0.33, 0.67)));
}

vec3 samplePalette(float t) {
  t = fract(t);
  float scaled = t * float(uColorCount);
  int idx = int(floor(scaled));
  float blend = fract(scaled);
  int nextIdx = idx + 1;
  if (nextIdx >= uColorCount) nextIdx = 0;
  return mix(uColors[idx], uColors[nextIdx], blend);
}

vec3 strandColor(float t) {
  if (uColorCount > 0) return samplePalette(t);
  return spectrum(t);
}

float hash(float n) {
  return fract(sin(n) * 43758.5453123);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;
  uv /= max(uScale, 0.0001);

  float e = 0.06 + uIntensity * 0.94;
  float env = pow(max(cos(uv.x * PI * 1.3), 0.0), uTaper);

  // Фронт идёт слева направо с запасом за кромками, чтобы в крайних
  // состояниях смесь была полной по всему полю, а не только до края.
  float xf = mix(-1.15, 1.15, uFront);
  float m = 1.0 - smoothstep(xf - 0.16, xf + 0.16, uv.x); // 1 = расплетено

  vec3 col = vec3(0.0);

  for (int i = 0; i < ${MAX_STRANDS}; i++) {
    if (i >= uStrandCount) break;

    float fi = float(i);
    float ph = fi * 1.7 * uSpread;
    float freq = (2.0 + fi * 0.35) * uWaviness;
    float spd = 1.4 + fi * 1.2;
    float tt = uTime * uSpeed;

    // Чистый режим — формула Hero без изменений.
    float wClean = sin(uv.x * freq + tt * spd + ph) * 0.60
                 + sin(uv.x * freq * 1.1 - tt * spd * 0.7 + ph * 1.7) * 0.40;

    // Спутанный режим: частота выше, вторая октава сильнее, плюс
    // персональный вертикальный разброс — нити пересекаются, а не идут слоями.
    float wTangle = sin(uv.x * freq * 2.7 + tt * spd * 1.2 + ph * 2.3) * 0.52
                  + sin(uv.x * freq * 4.3 - tt * spd * 0.85 + ph * 4.7) * 0.48;
    float scatter = (hash(fi * 12.9898 + 7.13) - 0.5) * 0.34;

    float amp = (0.1 + 0.02 * e) * env * uAmplitude;
    float yClean = wClean * amp;
    float yTangle = wTangle * amp * 1.45 + scatter * env;

    float y = mix(yTangle, yClean, m);

    float d = abs(uv.y - y);
    float thick = (0.001 + 0.05 * e) * (0.35 + env) * uThickness;
    // Спутанные нити тоньше и жёстче — читаются помехой, а не светом.
    thick *= mix(0.7, 1.0, m);
    float g = thick / (d + thick * 0.45);
    g = g * g;

    float h = fi / float(uStrandCount) + uv.x * 0.30 + uTime * 0.04 + uHueShift;
    vec3 c = strandColor(h);
    // До фронта цвет придушен к серому и по яркости — цвет «приходит» с фронтом.
    float grayC = dot(c, vec3(0.2126, 0.7152, 0.0722));
    c = mix(vec3(grayC), c, mix(0.3, 1.0, m));

    col += c * g * env * mix(0.6, 1.0, m);
  }

  col *= 0.45 + 0.7 * e;

  // Лёгкая вспышка на самом фронте; живёт только пока фронт в кадре.
  float alive = smoothstep(0.0, 0.06, uFront) * (1.0 - smoothstep(0.94, 1.0, uFront));
  col *= 1.0 + 0.5 * alive * exp(-pow((uv.x - xf) / 0.09, 2.0));

  col = 1.0 - exp(-col * uGlow);

  float gray = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = max(mix(vec3(gray), col, uSaturation), 0.0);

  float lum = max(max(col.r, col.g), col.b);
  float alpha = clamp(lum, 0.0, 1.0) * uOpacity;

  fragColor = vec4(col * uOpacity, alpha);
}
`

export interface StrandsUntangleProps {
  /** Запускает однократный проход фронта расплетания. */
  active: boolean
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
  className?: string
}

const buildPalette = (colors: string[]): number[][] => {
  const filled = colors && colors.length ? colors : ['#ffffff']
  const padded: number[][] = []
  for (let i = 0; i < MAX_COLORS; i++) {
    const hex = filled[i] ?? filled[filled.length - 1]
    const c = new Color(hex)
    padded.push([c.r, c.g, c.b])
  }
  return padded
}

const easeInOutCubic = (x: number) =>
  x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2

export default function StrandsUntangle({
  active,
  colors = ['#b4d2ff', '#426eff', '#ffffff'],
  count = 6,
  speed = 0.3,
  amplitude = 0.5,
  waviness = 1,
  thickness = 0.5,
  glow = 2,
  taper = 3,
  spread = 1,
  hueShift = 0,
  intensity = 0.45,
  saturation = 1,
  opacity = 1,
  scale = 1.15,
  className = '',
}: StrandsUntangleProps) {
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
    if (!('drawBuffers' in gl)) return // шейдер требует WebGL2
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
        uResolution: { value: [1, 1] },
        uColors: { value: buildPalette(colors) },
        uColorCount: { value: Math.min(colors.length, MAX_COLORS) },
        uStrandCount: { value: Math.min(Math.max(Math.round(count), 1), MAX_STRANDS) },
        uSpeed: { value: speed },
        uAmplitude: { value: amplitude },
        uWaviness: { value: waviness },
        uThickness: { value: thickness },
        uGlow: { value: glow },
        uTaper: { value: taper },
        uSpread: { value: spread },
        uHueShift: { value: hueShift },
        uIntensity: { value: intensity },
        uOpacity: { value: opacity },
        uScale: { value: scale },
        uSaturation: { value: saturation },
        uFront: { value: reduced ? 1 : 0 },
      },
    })
    const mesh = new Mesh(gl, { geometry, program })

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = container
      renderer.setSize(w, h)
      // gl_FragCoord — в физических пикселях, uResolution обязан совпадать
      // с drawing buffer (см. тот же комментарий в Strands).
      program.uniforms.uResolution.value = [gl.canvas.width, gl.canvas.height]
    }
    const ro = new ResizeObserver(resize)
    ro.observe(container)
    resize()

    // Фронт стартует с первого кадра после active — loop.ts может держать
    // рендер на паузе вне вьюпорта, поэтому привязываемся к rAF-времени.
    let frontStart: number | null = null

    const stopLoop = startRenderLoop(container, (t) => {
      program.uniforms.uTime.value = t * 0.001
      if (!reduced && activeRef.current) {
        if (frontStart === null) frontStart = t
        const p = Math.min((t - frontStart) / FRONT_MS, 1)
        program.uniforms.uFront.value = easeInOutCubic(p)
      }
      renderer.render({ scene: mesh })
    })

    return () => {
      stopLoop()
      ro.disconnect()
      gl.getExtension('WEBGL_lose_context')?.loseContext()
      gl.canvas.remove()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- сцена монтируется один раз
  }, [])

  return (
    <div
      ref={containerRef}
      className={`pointer-events-none relative h-full w-full overflow-hidden ${className}`}
    />
  )
}
