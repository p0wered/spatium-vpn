import { useEffect, useRef, useState } from 'react'
import { useInView, useReducedMotion } from 'motion/react'

/**
 * Слово в заголовке, которое проходит цензуру: пока на него не посмотрели —
 * оно набрано мусорными глифами, при появлении в кадре разбирается в нормальное
 * слово.
 *
 * Механика взята из React Bits DecryptedText (`refs/`), но переписана: оригинал
 * держит React-стейт на каждый символ и перерисовывает все спаны каждые 50 мс
 * всё время жизни компонента. Здесь интервал живёт только на время разбора —
 * до появления в кадре и после дочитывания он остановлен.
 */

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&$@*/\\<>'
const SHUFFLE_MS = 55

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)

export function DecodeWord({
  word,
  duration = 900,
  active = true,
  className = '',
}: {
  word: string
  /** Сколько длится разбор слова, мс */
  duration?: number
  /** Внешний момент запуска — нужен для синхронизации с сюжетной анимацией */
  active?: boolean
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const reduced = useReducedMotion()
  // Слово короткое и стоит в заголовке — ждём, пока оно войдёт в кадр целиком,
  // иначе разбор успевает пройти где-то у нижней кромки экрана
  const inView = useInView(ref, { once: true, amount: 0.9 })

  const [revealed, setRevealed] = useState(0)
  // Счётчик кадров тасовки: меняет только нераскрытые глифы
  const [shuffle, setShuffle] = useState(0)

  useEffect(() => {
    if (reduced) {
      setRevealed(word.length)
      return
    }
    if (!inView || !active) return

    const start = performance.now()
    const timer = window.setInterval(() => {
      const ratio = clamp01((performance.now() - start) / duration)
      setRevealed(Math.round(ratio * word.length))
      setShuffle((n) => n + 1)
      if (ratio >= 1) clearInterval(timer)
    }, SHUFFLE_MS)

    return () => clearInterval(timer)
  }, [inView, reduced, word, duration, active])

  // Считается прямо в рендере: он и так происходит только на смену revealed
  // или shuffle, а мемоизация по счётчику тасовки ничего бы не сэкономила
  void shuffle
  const chars = word.split('').map((char, i) => {
    if (i < revealed) return { char, done: true }
    return { char: GLYPHS[Math.floor(Math.random() * GLYPHS.length)], done: false }
  })

  return (
    /*
     * Ширину задаёт настоящее слово в скрытом слое, а мусорные глифы выведены
     * из потока абсолютом: они шире оригинала, и если дать им влиять на размер,
     * заголовок скачет — на калибровке он от этого перекладывался с двух строк
     * на одну ровно в момент, когда слово дочитывалось. `visibility: hidden`
     * скринридеры не читают, поэтому доступный текст отдаётся отдельно.
     */
    <span ref={ref} className={`relative inline-block ${className}`}>
      <span className="invisible">{word}</span>
      <span className="sr-only">{word}</span>
      <span aria-hidden className="absolute inset-0 whitespace-pre">
        {chars.map(({ char }, i) => (
          <span key={i}>{char}</span>
        ))}
      </span>
    </span>
  )
}
