import { useEffect, useRef, type RefObject } from 'react'
import { Mesh, Program, Renderer, Triangle } from 'ogl'
import { startRenderLoop } from './loop'
import { LIGHT_PALETTE_GLSL } from './lightPalette'
import { LIGHT_REVEAL_DELAY_MS, LIGHT_REVEAL_DURATION_MS } from './lightMotion'

const BEAM_LENGTH_PX = 620
const BEAM_FADE_LENGTH_PX = 240

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
uniform float uBeamStart;
uniform float uBeamFadeEnd;
uniform float uPanelHeight;
uniform float uVertical;
uniform float uProfileScale;
uniform vec2 uImpact;
uniform vec2 uResolution;

out vec4 fragColor;
${LIGHT_PALETTE_GLSL}

float easeOut(float t) {
  return 1.0 - pow(1.0 - clamp(t, 0.0, 1.0), 3.0);
}

void main() {
  vec2 pixel = gl_FragCoord.xy;
  vec2 impact = vec2(uImpact.x, uResolution.y - uImpact.y);
  // On stacked layouts, the same ray arrives from above and diffuses along
  // the top edge. Rotation and uniform scaling preserve the light's silhouette.
  if (uVertical > 0.5) {
    pixel = vec2(uResolution.y - pixel.y, pixel.x);
    impact = vec2(uImpact.y, uImpact.x);
  }
  pixel = impact + (pixel - impact) / uProfileScale;
  float x = pixel.x;
  float y = pixel.y;
  float leftDistance = max(impact.x - x, 0.0);
  float verticalDistance = abs(y - impact.y);
  float beamLength = max(impact.x - uBeamStart, 1.0);
  float leftExtinction = smoothstep(uBeamStart, uBeamFadeEnd, x);
  float rightDistance = max(x - impact.x, 0.0);

  // Contact is the exact endpoint of travel. Only then can the beam broaden
  // and the panel light up; the final field is never revealed by a moving mask.
  float reveal = clamp(uReveal, 0.0, 1.0);
  const float contactTime = 0.38;
  float travel = clamp(reveal / contactTime, 0.0, 1.0);
  // Accelerate into the edge instead of drifting at almost constant speed.
  float headX = mix(uBeamStart, impact.x, pow(travel, 2.8));
  float contact = clamp((reveal - contactTime) / (1.0 - contactTime), 0.0, 1.0);
  float pressure = easeOut(contact);
  // The core responds first; the atmosphere follows with a slower release.
  float bloom = easeOut(clamp((contact - 0.08) / 0.92, 0.0, 1.0));
  float handoff = smoothstep(0.0, 0.12, contact);
  float beamIgnition = smoothstep(0.0, 0.08, reveal);

  // A rounded, narrow tip leads a continuous cold-white trail. Its distance
  // field follows the head, not the eventual broad silhouette at the panel.
  float tipDistance = length(vec2(max(x - headX, 0.0), verticalDistance));
  float flightCore = exp(-pow(tipDistance / 0.85, 1.42));
  float flightBody = exp(-tipDistance / 2.8);
  float flightHaze = exp(-tipDistance / 9.0);
  vec3 flightColor = (flightCore * coreWhite * 1.58
    + flightBody * paleBlue * 0.52 + flightHaze * haloBlue * 0.18)
    * leftExtinction * beamIgnition * (1.0 - handoff);

  // Pressure at the contact point grows into the approved final ray profile.
  float proximity = exp(-leftDistance / max(beamLength * 0.30, 1.0));
  float cusp = pow(proximity, 2.15);
  float coreWidth = mix(0.65, 34.0, cusp * pressure);
  float bodyWidth = mix(2.2, 62.0, pow(proximity, 1.58) * pressure);
  float hazeWidth = mix(8.0, 190.0, pow(proximity, 1.02) * bloom);
  float coreTransmission = exp(-rightDistance / 18.0);
  float bodyTransmission = exp(-rightDistance / 46.0);
  float hazeTransmission = exp(-rightDistance / 104.0);
  float rayCore = exp(-pow(verticalDistance / coreWidth, 1.42))
    * leftExtinction
    * coreTransmission;
  float rayBody = exp(-verticalDistance / bodyWidth)
    * leftExtinction
    * bodyTransmission;
  float rayHaze = exp(-verticalDistance / hazeWidth)
    * leftExtinction
    * hazeTransmission;

  // Ice Ridge rotated ninety degrees. Its envelope and layered falloff mirror
  // the Bypass light instead of approximating the edge with an ellipse.
  float ridgeAxis = (y - impact.y) / max(uPanelHeight * 0.42, 1.0);
  float ridgeEnvelope = pow(max(1.0 - ridgeAxis * ridgeAxis, 0.0), 1.8);
  float ridgeCenter = exp(-ridgeAxis * ridgeAxis * 4.2);
  float ridgeCrown = exp(-ridgeAxis * ridgeAxis * 9.0);
  float crossDistance = abs(x - impact.x);

  float ridgeCore = exp(-crossDistance * 1.2) * ridgeEnvelope;
  float ridgeBody = exp(-crossDistance * 0.085)
    * ridgeEnvelope
    * (0.34 + ridgeCenter * 0.66);
  float ridgeHaze = exp(-crossDistance * 0.022) * ridgeCenter * ridgeEnvelope * 0.78;
  float ridgeCentralHaze = exp(-crossDistance * 0.011) * ridgeCrown * ridgeEnvelope * 0.97;

  // Diffusion starts at contact and spreads in both directions along the edge.
  float ridgeSettle = smoothstep(0.45, 1.0, contact);
  float diffusionWidth = mix(0.025, 0.82, bloom);
  float ridgeDiffusion = exp(-pow(abs(ridgeAxis) / max(diffusionWidth, 0.001), 1.45));
  float ridgeField = mix(ridgeDiffusion, 1.0, ridgeSettle) * handoff;

  // A localized, restrained flash rises after impact and settles to zero.
  float arrivalPulse = smoothstep(0.0, 0.06, contact)
    * (1.0 - smoothstep(0.06, 0.55, contact));
  float sourceCore = exp(-crossDistance * 0.34) * exp(-verticalDistance * 0.040);
  float sourceBloom = exp(-crossDistance * 0.052) * exp(-verticalDistance * 0.013);
  vec3 source = (sourceCore * iceWhite * 0.82 + sourceBloom * haloBlue * 0.22)
    * arrivalPulse;

  float breathe = 0.988 + sin(uTime * 0.34) * 0.012;
  vec3 rayColor = rayHaze * handoff * haloBlue * 0.18
    + rayBody * handoff * paleBlue * 0.52
    + rayCore * handoff * coreWhite * 1.58;
  vec3 ridgeColor = (ridgeHaze + ridgeCentralHaze) * haloBlue * 0.56
    + ridgeBody * paleBlue * 0.68
    + ridgeCore * coreWhite * 1.85;
  vec3 col = flightColor + rayColor + ridgeColor * ridgeField + source;
  col *= breathe;
  col = 1.0 - exp(-col * 1.05);

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
 */
export default function PrivacyLight({ active, anchorRef }: PrivacyLightProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef(active)
  const revealStartRef = useRef<number | null>(null)
  const renderOnceRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    revealStartRef.current = active ? performance.now() + LIGHT_REVEAL_DELAY_MS : null
  }, [active])

  useEffect(() => {
    activeRef.current = active
    if (active) requestAnimationFrame(() => renderOnceRef.current?.())
  }, [active])

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
        uBeamStart: { value: 0 },
        uBeamFadeEnd: { value: 1 },
        uPanelHeight: { value: 1 },
        uVertical: { value: 0 },
        uProfileScale: { value: 1 },
        uImpact: { value: [1, 1] },
        uResolution: { value: [1, 1] },
      },
      transparent: true,
    })
    const mesh = new Mesh(gl, { geometry, program })

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
      const impactX = anchorRect.left - containerRect.left + (compact ? anchorRect.width * 0.5 : 0)
      const impactY = anchorRect.top - containerRect.top + (compact ? 0 : anchorRect.height * 0.515)
      const impactAxis = compact ? impactY * scaleY : impactX * scaleX
      const axisScale = compact ? scaleY : scaleX
      const beamLength = compact ? 88 : BEAM_LENGTH_PX
      const fadeLength = compact ? 36 : BEAM_FADE_LENGTH_PX
      const beamStart = impactAxis - (beamLength * axisScale) / profileScale

      program.uniforms.uResolution.value = [gl.canvas.width, gl.canvas.height]
      program.uniforms.uVertical.value = compact ? 1 : 0
      program.uniforms.uProfileScale.value = profileScale
      program.uniforms.uBeamStart.value = beamStart
      program.uniforms.uBeamFadeEnd.value = beamStart + (fadeLength * axisScale) / profileScale
      program.uniforms.uPanelHeight.value = compact
        ? (anchorRect.width * scaleX) / profileScale
        : anchorRect.height * scaleY
      program.uniforms.uImpact.value = [impactX * scaleX, impactY * scaleY]
      // Reduced motion renders one frame; keep it aligned after a breakpoint change.
      renderOnceRef.current?.()
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(container)
    if (anchorRef.current) resizeObserver.observe(anchorRef.current)
    resize()

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const renderFrame = (timeMs: number) => {
      program.uniforms.uTime.value = timeMs * 0.001

      const revealStart = revealStartRef.current
      const reveal =
        reducedMotion && activeRef.current
          ? 1
          : revealStart === null
            ? 0
            : Math.min(Math.max((timeMs - revealStart) / LIGHT_REVEAL_DURATION_MS, 0), 1)
      program.uniforms.uReveal.value = reveal
      renderer.render({ scene: mesh })
    }
    renderOnceRef.current = () => renderFrame(performance.now())
    const stopLoop = startRenderLoop(container, renderFrame)

    return () => {
      renderOnceRef.current = null
      stopLoop()
      resizeObserver.disconnect()
      gl.getExtension('WEBGL_lose_context')?.loseContext()
      gl.canvas.remove()
    }
  }, [anchorRef])

  return <div ref={containerRef} className="h-full w-full" />
}
