/**
 * Общий rAF-цикл для WebGL-фонов:
 * - пауза вне вьюпорта (IntersectionObserver);
 * - prefers-reduced-motion → один статичный кадр вместо анимации;
 * - потолок частоты кадров: фоновый свет меняется медленно, а 120-герцовый
 *   дисплей иначе удваивает нагрузку на GPU без видимой разницы;
 * - render возвращает false, когда нарисованный кадр уже не изменится. Цикл
 *   переходит на idleFps (или останавливается при idleFps = 0) — это снимает
 *   с GPU секции, которые доиграли reveal и дальше рисуют одно и то же.
 */

export type RenderFrame = (timeMs: number) => boolean | void

export interface RenderLoopOptions {
  /** Потолок кадров, пока сцена анимируется. */
  fps?: number
  /** Потолок после того, как render вернул false. 0 — остановить цикл. */
  idleFps?: number
  /** Момент, который отрисовывается один раз при prefers-reduced-motion. */
  staticTimeMs?: number
}

export interface RenderLoop {
  /** Перерисовать после изменений, которые цикл не отслеживает: resize, смена props. */
  invalidate: () => void
  /** Снять обработчики и остановить цикл. */
  stop: () => void
}

export function startRenderLoop(
  container: HTMLElement,
  render: RenderFrame,
  { fps = 60, idleFps = fps, staticTimeMs = 3000 }: RenderLoopOptions = {},
): RenderLoop {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const activeInterval = 1000 / fps
  const idleInterval = idleFps > 0 ? 1000 / idleFps : Number.POSITIVE_INFINITY

  let raf = 0
  let running = false
  let visible = false
  let settled = false
  let lastDrawn = 0

  // Частота дисплея почти никогда не кратна потолку: сравнение с полным
  // интервалом роняло бы 60 fps до 30 на 60-герцовом экране, где кадры
  // приходят каждые 16.67 мс. Допуск пропускает ближайший кадр вместо
  // следующего, отклоняясь максимум на четверть интервала.
  const dueFor = (interval: number) => interval * 0.75

  const pause = () => {
    running = false
    cancelAnimationFrame(raf)
  }

  const frame = (t: number) => {
    if (!running) return
    raf = requestAnimationFrame(frame)

    const interval = settled ? idleInterval : activeInterval
    if (t - lastDrawn < dueFor(interval)) return
    lastDrawn = t

    settled = render(t) === false
    if (settled && idleFps === 0) pause()
  }

  const resume = () => {
    if (running) return
    running = true
    raf = requestAnimationFrame(frame)
  }

  // Кадр после паузы всегда рисуется заново: канвас мог быть сброшен, а
  // settled-состояние относилось к прежним размерам и uniform'ам.
  const restart = () => {
    settled = false
    lastDrawn = 0
    if (reduced) {
      render(staticTimeMs)
      return
    }
    resume()
  }

  const invalidate = () => {
    if (!visible) return
    restart()
  }

  const io = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting
      if (visible) restart()
      else pause()
    },
    { threshold: 0.05 },
  )
  io.observe(container)

  return {
    invalidate,
    stop: () => {
      visible = false
      pause()
      io.disconnect()
    },
  }
}

export const hexToRgb = (hex: string): [number, number, number] => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return m
    ? [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255]
    : [1, 1, 1]
}
