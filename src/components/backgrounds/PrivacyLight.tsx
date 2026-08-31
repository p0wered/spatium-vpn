import { useEffect, useRef, type RefObject } from 'react'
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
uniform float uBeamFadeEnd;
uniform float uPanelHeight;
uniform vec2 uImpact;
uniform vec2 uResolution;

out vec4 fragColor;

float easeOut(float t) {
  return 1.0 - pow(1.0 - clamp(t, 0.0, 1.0), 3.0);
}

float easeInCruise(float t) {
  t = clamp(t, 0.0, 1.0);
  // This split preserves the original 4t^3 launch, then continues at its
  // current velocity so the beam reaches the panel without braking.
  float split = 0.32635;
  float coefficient = 1.0 / (split * split * (3.0 - 2.0 * split));
  float splitValue = coefficient * split * split * split;
  float cruiseVelocity = 3.0 * coefficient * split * split;
  return t < split
    ? coefficient * t * t * t
    : splitValue + cruiseVelocity * (t - split);
}

void main() {
  vec2 pixel = gl_FragCoord.xy;
  vec2 impact = vec2(uImpact.x, uResolution.y - uImpact.y);
  float x = pixel.x;
  float y = pixel.y;
  float leftDistance = max(impact.x - x, 0.0);
  float verticalDistance = abs(y - impact.y);
  float beamLength = max(impact.x, 1.0);
  float leftExtinction = smoothstep(0.0, uBeamFadeEnd, x);
  float rightDistance = max(x - impact.x, 0.0);

  // A narrow ray for most of its travel, accelerating into a broad white cusp
  // only near impact. Core, body, and haze share one profile so the split reads
  // as the same light refracting at the glass rather than a separate bloom.
  float proximity = exp(-leftDistance / max(beamLength * 0.30, 1.0));
  float cusp = pow(proximity, 2.15);
  float coreWidth = mix(0.65, 34.0, cusp);
  float bodyWidth = mix(2.2, 62.0, pow(proximity, 1.58));
  float hazeWidth = mix(8.0, 190.0, pow(proximity, 1.02));
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

  float ridgeCore = exp(-crossDistance * 0.72) * ridgeEnvelope;
  float ridgeBody = exp(-crossDistance * 0.085)
    * ridgeEnvelope
    * (0.34 + ridgeCenter * 0.66);
  float ridgeHaze = exp(-crossDistance * 0.022) * ridgeCenter * ridgeEnvelope * 0.38;
  float ridgeCentralHaze = exp(-crossDistance * 0.011) * ridgeCrown * ridgeEnvelope * 0.17;

  float reveal = clamp(uReveal, 0.0, 1.0);
  float travelProgress = clamp(reveal / 0.64, 0.0, 1.0);
  float travel = easeInCruise(travelProgress);
  float headX = mix(-24.0, impact.x, travel);
  float beamIgnition = smoothstep(0.0, 0.07, reveal);
  float transmittedReveal = smoothstep(0.625, 0.69, reveal);
  float coreFront = 1.0 - smoothstep(headX - 3.0, headX + 7.0, x);
  float fieldFront = 1.0 - smoothstep(headX - 150.0, headX + 26.0, x);
  float coreReveal = max(coreFront, transmittedReveal) * beamIgnition;
  float fieldReveal = max(fieldFront, transmittedReveal) * beamIgnition;

  // Arrival energy becomes ridge diffusion. There is no independent fade or
  // mask edge, so the travelling ray and the vertical light read as one event.
  float ridgeIgnition = smoothstep(0.625, 0.67, reveal);
  float ridgeTravel = easeOut(smoothstep(0.63, 0.90, reveal));
  float ridgeSettle = smoothstep(0.72, 1.0, reveal);
  float diffusionWidth = mix(0.025, 0.82, ridgeTravel);
  float ridgeDiffusion = exp(-pow(abs(ridgeAxis) / max(diffusionWidth, 0.001), 1.45));
  float ridgeField = mix(ridgeDiffusion, 1.0, ridgeSettle) * ridgeIgnition;

  float headDistance = (x - headX) / 18.0;
  float headCore = exp(-pow(verticalDistance / max(coreWidth * 1.12, 0.8), 1.42));
  float headBody = exp(-verticalDistance / max(bodyWidth, 2.0));
  float movingHead = exp(-headDistance * headDistance)
    * (headCore * 0.42 + headBody * 0.08)
    * (1.0 - ridgeIgnition)
    * beamIgnition;
  float arrivalDistance = (reveal - 0.64) / 0.050;
  float arrivalPulse = exp(-arrivalDistance * arrivalDistance);
  float sourceCore = exp(-crossDistance * 0.34) * exp(-verticalDistance * 0.040);
  float sourceBloom = exp(-crossDistance * 0.052) * exp(-verticalDistance * 0.013);
  float source = movingHead * 0.62
    + (sourceCore * 0.82 + sourceBloom * 0.22) * arrivalPulse;

  float breathe = 0.988 + sin(uTime * 0.34) * 0.012;
  vec3 ice = vec3(0.56, 0.68, 0.92);
  vec3 frost = vec3(0.80, 0.87, 1.0);
  vec3 white = vec3(1.0);

  vec3 rayColor = rayHaze * fieldReveal * ice * 0.30
    + rayBody * fieldReveal * frost * 0.68
    + rayCore * coreReveal * white * 1.58;
  vec3 ridgeColor = (ridgeHaze + ridgeCentralHaze) * ice
    + ridgeBody * frost * 0.78
    + ridgeCore * white * 1.65;
  vec3 col = rayColor + ridgeColor * ridgeField + source * frost;
  col *= breathe;
  col = 1.0 - exp(-col * 1.55);

  float alpha = clamp(max(max(col.r, col.g), col.b), 0.0, 1.0);
  fragColor = vec4(col, alpha);
}
`

interface PrivacyLightProps {
  active: boolean
  anchorRef: RefObject<HTMLElement | null>
  boundsRef: RefObject<HTMLElement | null>
}

/**
 * A fullscreen light field aligned to the Privacy panel's left edge. The
 * travelling ray and vertical ridge are one event: arrival energy becomes an
 * Ice-Ridge-style diffusion along the glass boundary.
 */
export default function PrivacyLight({ active, anchorRef, boundsRef }: PrivacyLightProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef(active)
  const revealStartRef = useRef<number | null>(null)
  const renderOnceRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    revealStartRef.current = active ? performance.now() + 480 : null
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
        uBeamFadeEnd: { value: 1 },
        uPanelHeight: { value: 1 },
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
      const bounds = boundsRef.current
      if (width === 0 || height === 0 || !anchor || !bounds) return

      renderer.setSize(width, height)
      const containerRect = container.getBoundingClientRect()
      const anchorRect = anchor.getBoundingClientRect()
      const boundsRect = bounds.getBoundingClientRect()
      const scaleX = gl.canvas.width / width
      const scaleY = gl.canvas.height / height

      program.uniforms.uResolution.value = [gl.canvas.width, gl.canvas.height]
      const beamFadeEnd = Math.max(
        boundsRect.left - containerRect.left + 180,
        width * 0.16,
      )
      program.uniforms.uBeamFadeEnd.value = beamFadeEnd * scaleX
      program.uniforms.uPanelHeight.value = anchorRect.height * scaleY
      program.uniforms.uImpact.value = [
        (anchorRect.left - containerRect.left) * scaleX,
        (anchorRect.top - containerRect.top + anchorRect.height * 0.515) * scaleY,
      ]
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(container)
    if (anchorRef.current) resizeObserver.observe(anchorRef.current)
    if (boundsRef.current) resizeObserver.observe(boundsRef.current)
    resize()

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const duration = 1180
    const renderFrame = (timeMs: number) => {
      program.uniforms.uTime.value = timeMs * 0.001

      const revealStart = revealStartRef.current
      const reveal =
        reducedMotion && activeRef.current
          ? 1
          : revealStart === null
            ? 0
            : Math.min(Math.max((timeMs - revealStart) / duration, 0), 1)
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
  }, [anchorRef, boundsRef])

  return <div ref={containerRef} className="h-full w-full" />
}
