import { useEffect, useRef, type CSSProperties } from 'react'
import { Mesh, Program, Renderer, Triangle } from 'ogl'
import { hexToRgb } from '../../components/backgrounds/loop'
import { coreFrag, coreVert } from './coreShader'

export type CorePhase = 'off' | 'connecting' | 'on' | 'disconnecting'

type ConnectCoreProps = {
  phase: CorePhase
  /** Смена значения запускает ударную волну. Обычно — счётчик нажатий. */
  waveKey?: number
  /**
   * Радиус матового диска кнопки в CSS-px — единица длины шейдера (r = 1 на
   * кромке диска). Все радиусы внутри заданы относительно кнопки, поэтому
   * размер канваса можно менять, не перекалибровывая свет.
   */
  unit: number
  className?: string
  style?: CSSProperties
}

/** Длительность ударной волны, мс. Было 1100 — кольцо доползало до края уже
 *  после того, как отработала кнопка, и читалось отдельным событием, а не
 *  откликом на нажатие. Профиль волны при этом тот же: в шейдере и радиус, и
 *  затухание считаются от прогресса 0..1, а не от времени. */
const WAVE_MS = 850

/**
 * Световое ядро кнопки подключения — единственный WebGL-эффект этой страницы. Канвас шире кнопки
 * и висит под ней: матовый диск кнопки размывает ядро backdrop-фильтром,
 * а ореол и ударная волна свободно выходят за края.
 *
 * Свой rAF-цикл вместо общего loop.ts: тому нужен только таймер, а здесь
 * при reduced-motion всё равно требуется перерисовка на каждой смене фазы —
 * иначе кнопка визуально перестаёт реагировать на нажатие.
 */
export function ConnectCore({
  phase,
  waveKey = 0,
  unit,
  className = '',
  style,
}: ConnectCoreProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const phaseRef = useRef(phase)
  const waveStartRef = useRef(-1)
  /** Ставится эффектом GL, читается эффектами фазы/волны */
  const renderRef = useRef<((timeMs: number) => void) | null>(null)
  const reducedRef = useRef(false)

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

    /*
     * Цвета берём из токенов темы, а не из констант: значения ice/beam
     * пользователь калибрует в index.css, шейдер должен ехать следом.
     */
    const themeColor = (name: string, fallback: string) => {
      const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
      return hexToRgb(/^#?[0-9a-f]{6}$/i.test(raw) ? raw : fallback)
    }

    const uniforms = {
      uResolution: { value: [1, 1] },
      uUnit: { value: unit },
      uTime: { value: 0 },
      uOn: { value: phaseRef.current === 'on' ? 1 : 0 },
      uBusy: { value: 0 },
      uWave: { value: 0 },
      uIce: { value: themeColor('--color-ice', '#aaccff') },
      uBeam: { value: themeColor('--color-beam', '#829bff') },
    }

    const mesh = new Mesh(gl, {
      geometry: new Triangle(gl),
      program: new Program(gl, {
        vertex: coreVert,
        fragment: coreFrag,
        uniforms,
        transparent: true,
      }),
    })

    const resize = () => {
      renderer.dpr = Math.min(window.devicePixelRatio, 2)
      const { clientWidth: w, clientHeight: h } = container
      renderer.setSize(w, h)
      uniforms.uResolution.value = [w, h]
    }
    const ro = new ResizeObserver(resize)
    ro.observe(container)
    resize()

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    reducedRef.current = reduced

    let lastT = 0
    const render = (timeMs: number) => {
      const elapsed = timeMs * 0.001
      const dt = Math.min(Math.max(elapsed - lastT, 0), 0.1)
      lastT = elapsed
      uniforms.uTime.value = elapsed

      const p = phaseRef.current
      const targetOn = p === 'on' ? 1 : 0
      const targetBusy = p === 'connecting' || p === 'disconnecting' ? 1 : 0

      if (reduced) {
        uniforms.uOn.value = targetOn
        uniforms.uBusy.value = targetBusy
      } else {
        // Подключение разгорается медленнее, чем гаснет отключение
        const onRate = targetOn > uniforms.uOn.value ? 1.6 : 3.2
        uniforms.uOn.value += (targetOn - uniforms.uOn.value) * Math.min(1, dt * onRate)
        uniforms.uBusy.value += (targetBusy - uniforms.uBusy.value) * Math.min(1, dt * 5)
      }

      const waveStart = waveStartRef.current
      uniforms.uWave.value =
        waveStart < 0 || reduced ? 0 : Math.min(1, (timeMs - waveStart) / WAVE_MS)
      if (uniforms.uWave.value >= 1) waveStartRef.current = -1

      renderer.render({ scene: mesh })
    }
    renderRef.current = render

    let raf = 0
    if (reduced) {
      render(3000)
    } else {
      const frame = (t: number) => {
        render(t)
        raf = requestAnimationFrame(frame)
      }
      raf = requestAnimationFrame(frame)
    }

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      renderRef.current = null
      gl.getExtension('WEBGL_lose_context')?.loseContext()
      gl.canvas.remove()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- канвас монтируется один раз; unit — константа разметки
  }, [])

  useEffect(() => {
    phaseRef.current = phase
    if (reducedRef.current) renderRef.current?.(3000)
  }, [phase])

  useEffect(() => {
    if (!waveKey) return
    waveStartRef.current = performance.now()
  }, [waveKey])

  return (
    <div
      ref={containerRef}
      aria-hidden
      style={style}
      className={`pointer-events-none overflow-hidden ${className}`}
    />
  )
}
