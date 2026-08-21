import { useEffect, useRef, useState } from 'react'
import { motion, useInView, useReducedMotion, type Variants } from 'motion/react'
import { DecodeWord } from '../../components/DecodeWord'
import { GrainOverlay } from '../../components/GrainOverlay'
import { PrismField } from '../../components/light/PrismField'

const TRANSPORTS = ['VLESS', 'REALITY', 'XTLS-VISION', 'HYSTERIA2', 'TUIC', 'WIREGUARD']

const textContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15, delayChildren: 0.3 } },
}

/**
 * Секция обхода блокировок (см. PROJECT.md → «Наполнение секций»).
 *
 * Однократная сюжетная сцена: свет проходит через оптическое поле, после
 * первого обхода разбирается `unfiltered`, а по завершении приходят чипы.
 * Дальше поле живёт редкими локальными перестроениями, не повторяя интро.
 */
export function Bypass() {
  const sectionRef = useRef<HTMLElement>(null)
  const inView = useInView(sectionRef, { once: true, amount: 0.35 })
  const reduced = useReducedMotion()
  const [started, setStarted] = useState(false)
  const [decode, setDecode] = useState(false)
  const [transportsVisible, setTransportsVisible] = useState(false)

  const textItem: Variants = {
    hidden: reduced ? { opacity: 0 } : { opacity: 0, y: 28, filter: 'blur(6px)' },
    show: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
    },
  }

  useEffect(() => {
    if (!inView) return
    setStarted(true)

    if (reduced) {
      setDecode(true)
      setTransportsVisible(true)
      return
    }

    const decodeTimer = window.setTimeout(() => setDecode(true), 820)
    const transportsTimer = window.setTimeout(() => setTransportsVisible(true), 2480)
    return () => {
      clearTimeout(decodeTimer)
      clearTimeout(transportsTimer)
    }
  }, [inView, reduced])

  return (
    <section
      id="features"
      ref={sectionRef}
      className="relative flex min-h-svh flex-col overflow-hidden"
    >
      <PrismField active={started} className="absolute inset-0 z-0" />

      {/* Grain — верхним слоем, как в Hero; к кромкам гаснет, чтобы не резать стык секций */}
      <GrainOverlay className="z-20 mask-[linear-gradient(to_bottom,transparent,black_18%,black_84%,transparent)]" />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col px-6">
        <motion.div
          className="mt-[16svh] max-w-2xl"
          variants={textContainer}
          initial="hidden"
          animate={started ? 'show' : 'hidden'}
        >
          <motion.p
            variants={textItem}
            className="font-mono text-xs tracking-[0.18em] text-fg-muted uppercase"
          >
            Access
          </motion.p>

          <motion.h2
            variants={textItem}
            className="mt-4 text-4xl font-semibold tracking-tighter text-balance sm:text-6xl"
          >
            The internet, <DecodeWord word="unfiltered" active={decode} />
          </motion.h2>

          <motion.p variants={textItem} className="mt-5 max-w-md leading-6 text-fg-muted">
            News sites, messengers, streaming — whatever your country decided you shouldn't reach.
            And when the blocks move, we move first.
          </motion.p>
        </motion.div>

        <motion.div
          className="mt-auto mb-[10svh]"
          initial={false}
          animate={
            transportsVisible
              ? { opacity: 1, y: 0, filter: 'blur(0px)' }
              : { opacity: 0, y: reduced ? 0 : 18, filter: reduced ? 'blur(0px)' : 'blur(4px)' }
          }
          transition={{ duration: reduced ? 0 : 0.72, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="font-mono text-[11px] tracking-[0.18em] text-fg-muted uppercase">
            Transports
          </p>
          <ul className="mt-3 flex flex-wrap gap-x-2 gap-y-2">
            {TRANSPORTS.map((name) => (
              <li
                key={name}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono
                text-[11px] tracking-[0.08em] text-fg/90 transition-all duration-300 ease-out
                hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/10 hover:text-fg
                hover:shadow-[0_0_18px_rgb(170_204_255/0.16)] motion-reduce:transform-none
                motion-reduce:transition-none"
              >
                {name}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  )
}
