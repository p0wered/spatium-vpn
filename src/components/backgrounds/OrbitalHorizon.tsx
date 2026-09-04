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

uniform float uReveal;
uniform vec2 uResolution;

out vec4 fragColor;

const float PI = 3.14159265;

float easeOutCubic(float value) {
  return 1.0 - pow(1.0 - value, 3.0);
}

vec3 sampleStrandPalette(float t) {
  vec3 paleBlue = vec3(0.58, 0.72, 1.0);
  vec3 electricBlue = vec3(0.19, 0.35, 0.94);
  vec3 white = vec3(0.82, 0.90, 1.0);
  float scaled = fract(t) * 3.0;

  if (scaled < 1.0) return mix(paleBlue, electricBlue, scaled);
  if (scaled < 2.0) return mix(electricBlue, white, scaled - 1.0);
  return mix(white, paleBlue, scaled - 2.0);
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  float reveal = clamp(uReveal, 0.0, 1.0);
  float progress = easeOutCubic(reveal);
  float responsiveMix = smoothstep(0.72, 1.24, aspect);

  // The original Strands profile, warped onto one fixed orbital curve.
  float halfSpan = uResolution.x * mix(0.56, 0.395, responsiveMix);
  float curveX = (frag.x - uResolution.x * 0.5) / halfSpan;
  float sag = uResolution.x * mix(0.118, 0.153, responsiveMix);
  float finalApex = uResolution.y * mix(0.69, 0.742, responsiveMix);
  float startApex = finalApex - uResolution.y * mix(0.040, 0.055, responsiveMix);
  float apex = mix(startApex, finalApex, progress);
  float curveY = apex - sag * curveX * curveX;

  // Keep the light profile perpendicular to the curve at every point.
  float slope = -2.0 * sag * curveX / halfSpan;
  float signedDistance = (frag.y - curveY) / sqrt(1.0 + slope * slope);
  float envelope = pow(max(cos(curveX * PI * 0.5), 0.0), 1.72);

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
    vec3(0.17, 0.28, 0.58),
    vec3(0.49, 0.64, 1.0),
    envelope
  );
  float intensity = 0.06 + progress * 0.61;
  vec3 color = strandColor * strand * envelope * progress;
  color += outerColor * outerGlow * envelope * progress * 0.24;
  color *= 0.45 + 0.7 * intensity;
  color = 1.0 - exp(-color * 2.75);

  float alpha = clamp(max(max(color.r, color.g), color.b), 0.0, 1.0);
  fragColor = vec4(color, alpha);
}
`

interface OrbitalHorizonProps {
  active: boolean
  revealDelayMs?: number
  revealDurationMs?: number
}

/**
 * A single transparent OGL pass for the testimonial-section horizon. The
 * shared render loop pauses it offscreen and resolves reduced motion to a
 * composed final frame instead of removing the graphic.
 */
export default function OrbitalHorizon({
  active,
  revealDelayMs = 250,
  revealDurationMs = 1500,
}: OrbitalHorizonProps) {
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
        uReveal: { value: 0 },
        uResolution: { value: [1, 1] },
      },
    })
    const mesh = new Mesh(gl, { geometry, program })

    const resize = () => {
      const { clientWidth: width, clientHeight: height } = container
      renderer.setSize(width, height)
      program.uniforms.uResolution.value = [gl.canvas.width, gl.canvas.height]
    }

    const observer = new ResizeObserver(resize)
    observer.observe(container)
    resize()

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const stopLoop = startRenderLoop(container, (timeMs) => {
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

  return <div ref={containerRef} className="pointer-events-none h-full w-full overflow-hidden" />
}
