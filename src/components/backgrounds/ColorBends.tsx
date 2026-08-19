import { useEffect, useRef } from 'react'
import { Mesh, Program, Renderer, Triangle } from 'ogl'
import { hexToRgb, startRenderLoop } from './loop'

/**
 * Адаптация React Bits ColorBends под SpatiumVPN: текучие цветные «ленты».
 * Главное изменение — портирован с three.js (~160 КБ gzip) на ogl (~12 КБ),
 * шейдер оригинала без изменений. Плюс общий цикл из loop.ts и нереактивные
 * пропсы, как у остальных фонов.
 */

const MAX_COLORS = 8

interface ColorBendsProps {
  className?: string
  rotation?: number
  speed?: number
  colors?: string[]
  transparent?: boolean
  autoRotate?: number
  scale?: number
  frequency?: number
  warpStrength?: number
  mouseInfluence?: number
  parallax?: number
  noise?: number
  iterations?: number
  intensity?: number
  bandWidth?: number
}

const vert = `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}`

const frag = `precision highp float;
#define MAX_COLORS ${MAX_COLORS}
uniform vec2 uCanvas;
uniform float uTime;
uniform float uSpeed;
uniform vec2 uRot;
uniform int uColorCount;
uniform vec3 uColors[MAX_COLORS];
uniform int uTransparent;
uniform float uScale;
uniform float uFrequency;
uniform float uWarpStrength;
uniform vec2 uPointer; // in NDC [-1,1]
uniform float uMouseInfluence;
uniform float uParallax;
uniform float uNoise;
uniform int uIterations;
uniform float uIntensity;
uniform float uBandWidth;
varying vec2 vUv;

void main() {
  float t = uTime * uSpeed;
  vec2 p = vUv * 2.0 - 1.0;
  p += uPointer * uParallax * 0.1;
  vec2 rp = vec2(p.x * uRot.x - p.y * uRot.y, p.x * uRot.y + p.y * uRot.x);
  vec2 q = vec2(rp.x * (uCanvas.x / uCanvas.y), rp.y);
  q /= max(uScale, 0.0001);
  q /= 0.5 + 0.2 * dot(q, q);
  q += 0.2 * cos(t) - 7.56;
  vec2 toward = (uPointer - rp);
  q += toward * uMouseInfluence * 0.2;

    for (int j = 0; j < 5; j++) {
      if (j >= uIterations - 1) break;
      vec2 rr = sin(1.5 * (q.yx * uFrequency) + 2.0 * cos(q * uFrequency));
      q += (rr - q) * 0.15;
    }

    vec3 col = vec3(0.0);
    float a = 1.0;

    if (uColorCount > 0) {
      vec2 s = q;
      vec3 sumCol = vec3(0.0);
      float cover = 0.0;
      for (int i = 0; i < MAX_COLORS; ++i) {
            if (i >= uColorCount) break;
            s -= 0.01;
            vec2 r = sin(1.5 * (s.yx * uFrequency) + 2.0 * cos(s * uFrequency));
            float m0 = length(r + sin(5.0 * r.y * uFrequency - 3.0 * t + float(i)) / 4.0);
            float kBelow = clamp(uWarpStrength, 0.0, 1.0);
            float kMix = pow(kBelow, 0.3);
            float gain = 1.0 + max(uWarpStrength - 1.0, 0.0);
            vec2 disp = (r - s) * kBelow;
            vec2 warped = s + disp * gain;
            float m1 = length(warped + sin(5.0 * warped.y * uFrequency - 3.0 * t + float(i)) / 4.0);
            float m = mix(m0, m1, kMix);
            float w = 1.0 - exp(-uBandWidth / exp(uBandWidth * m));
            sumCol += uColors[i] * w;
            cover = max(cover, w);
      }
      col = clamp(sumCol, 0.0, 1.0);
      a = uTransparent > 0 ? cover : 1.0;
    } else {
        vec2 s = q;
        for (int k = 0; k < 3; ++k) {
            s -= 0.01;
            vec2 r = sin(1.5 * (s.yx * uFrequency) + 2.0 * cos(s * uFrequency));
            float m0 = length(r + sin(5.0 * r.y * uFrequency - 3.0 * t + float(k)) / 4.0);
            float kBelow = clamp(uWarpStrength, 0.0, 1.0);
            float kMix = pow(kBelow, 0.3);
            float gain = 1.0 + max(uWarpStrength - 1.0, 0.0);
            vec2 disp = (r - s) * kBelow;
            vec2 warped = s + disp * gain;
            float m1 = length(warped + sin(5.0 * warped.y * uFrequency - 3.0 * t + float(k)) / 4.0);
            float m = mix(m0, m1, kMix);
            col[k] = 1.0 - exp(-uBandWidth / exp(uBandWidth * m));
        }
        a = uTransparent > 0 ? max(max(col.r, col.g), col.b) : 1.0;
    }

    col *= uIntensity;

    if (uNoise > 0.0001) {
      float n = fract(sin(dot(gl_FragCoord.xy + vec2(uTime), vec2(12.9898, 78.233))) * 43758.5453123);
      col += (n - 0.5) * uNoise;
      col = clamp(col, 0.0, 1.0);
    }

    vec3 rgb = (uTransparent > 0) ? col * a : col;
    gl_FragColor = vec4(rgb, a);
}`

export default function ColorBends({
  className = '',
  rotation = 90,
  speed = 0.2,
  colors = ['#426eff', '#101b4d', '#eaf2ff'],
  transparent = true,
  autoRotate = 0,
  scale = 1,
  frequency = 1,
  warpStrength = 1,
  mouseInfluence = 1,
  parallax = 0.5,
  noise = 0.1,
  iterations = 1,
  intensity = 1.5,
  bandWidth = 6,
}: ColorBendsProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const renderer = new Renderer({
      dpr: Math.min(window.devicePixelRatio, 2),
      alpha: true,
      premultipliedAlpha: true,
    })
    const gl = renderer.gl
    gl.canvas.style.width = '100%'
    gl.canvas.style.height = '100%'
    container.appendChild(gl.canvas)

    // Только обычный массив массивов: ogl резолвит uniform-массивы через
    // Array.isArray(value), Float32Array он молча отбрасывает
    const parsed = colors.filter(Boolean).slice(0, MAX_COLORS).map(hexToRgb)
    const uColors: number[][] = Array.from({ length: MAX_COLORS }, (_, i) => parsed[i] ?? [0, 0, 0])

    const uniforms = {
      uCanvas: { value: [1, 1] },
      uTime: { value: 0 },
      uSpeed: { value: speed },
      uRot: { value: [1, 0] },
      uColorCount: { value: parsed.length },
      uColors: { value: uColors },
      uTransparent: { value: transparent ? 1 : 0 },
      uScale: { value: scale },
      uFrequency: { value: frequency },
      uWarpStrength: { value: warpStrength },
      uPointer: { value: [0, 0] },
      uMouseInfluence: { value: mouseInfluence },
      uParallax: { value: parallax },
      uNoise: { value: noise },
      uIterations: { value: iterations },
      uIntensity: { value: intensity },
      uBandWidth: { value: bandWidth },
    }

    const geometry = new Triangle(gl)
    const program = new Program(gl, { vertex: vert, fragment: frag, uniforms, transparent: true })
    const mesh = new Mesh(gl, { geometry, program })

    const resize = () => {
      renderer.dpr = Math.min(window.devicePixelRatio, 2)
      const { clientWidth: w, clientHeight: h } = container
      renderer.setSize(w, h)
      uniforms.uCanvas.value = [w, h]
    }
    const ro = new ResizeObserver(resize)
    ro.observe(container)
    resize()

    const pointerTarget = { x: 0, y: 0 }
    const pointerCurrent = { x: 0, y: 0 }
    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect()
      pointerTarget.x = ((e.clientX - rect.left) / (rect.width || 1)) * 2 - 1
      pointerTarget.y = -(((e.clientY - rect.top) / (rect.height || 1)) * 2 - 1)
    }
    window.addEventListener('pointermove', onPointerMove)

    let lastT = 0
    const stopLoop = startRenderLoop(container, (t) => {
      const elapsed = t * 0.001
      const dt = Math.min(elapsed - lastT, 0.1)
      lastT = elapsed
      uniforms.uTime.value = elapsed

      const deg = (rotation % 360) + autoRotate * elapsed
      const rad = (deg * Math.PI) / 180
      uniforms.uRot.value = [Math.cos(rad), Math.sin(rad)]

      const amt = Math.min(1, dt * 8)
      pointerCurrent.x += (pointerTarget.x - pointerCurrent.x) * amt
      pointerCurrent.y += (pointerTarget.y - pointerCurrent.y) * amt
      uniforms.uPointer.value = [pointerCurrent.x, pointerCurrent.y]

      renderer.render({ scene: mesh })
    })

    return () => {
      stopLoop()
      ro.disconnect()
      window.removeEventListener('pointermove', onPointerMove)
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
