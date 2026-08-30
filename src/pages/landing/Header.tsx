import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Link, useNavigate } from 'react-router'
import {LogIn, Menu, X} from 'lucide-react'
import { Button } from '../../components/Button'
import { GradualBlur } from '../../components/GradualBlur'
import { Wordmark } from '../../components/Wordmark'
import { scrollToSection } from '../../lib/scroll'
import { setScrollLocked } from '../../lib/smoothScroll'
import { useSession } from '../../lib/session'

const links = [
  { id: 'features', label: 'Features' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'faq', label: 'FAQ' },
]

/** Стеклянная пилюля вошедшего: аватар-буква + ник, ведёт в dashboard */
function ProfilePill({ nickname, className = '' }: { nickname: string; className?: string }) {
  return (
    <Link
      to="/dashboard"
      className={`flex h-9 items-center gap-2 rounded-full border border-white/10 bg-white/8 pr-3.5 pl-1.5 text-sm font-medium transition-colors hover:border-white/14 hover:bg-white/14 ${className}`}
    >
      <span className="flex size-6 items-center justify-center rounded-full bg-white/12 text-[11px] font-semibold uppercase">
        {nickname.charAt(0)}
      </span>
      {nickname}
    </Link>
  )
}

/**
 * Хедер лендинга.
 * Всегда fixed; фона-подложки нет — только GradualBlur, который на чёрном
 * невидим и «материализуется» над проезжающим контентом. Зона блюра выше
 * навигационной строки, чтобы контент растворялся постепенно.
 * Сетка [1fr_auto_1fr] — ссылки в оптическом центре независимо от ширины
 * боковых частей. На мобильном ссылки и вход уезжают в overlay-меню.
 */
export function Header() {
  const session = useSession()
  const navigate = useNavigate()
  const reduced = useReducedMotion()
  const [open, setOpen] = useState(false)

  // Открытое меню: замок на скролл страницы + закрытие по Escape
  useEffect(() => {
    if (!open) return
    setScrollLocked(true)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      setScrollLocked(false)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const goTo = (id: string) => {
    setOpen(false)
    scrollToSection(id)
  }

  return (
    <>
      <motion.header
        className="fixed inset-x-0 top-0 z-40"
        initial={{ opacity: 0, y: reduced ? 0 : -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <GradualBlur />

        <div className="relative mx-auto grid h-16 max-w-6xl grid-cols-[1fr_auto_1fr] items-center px-4">
          <Wordmark className="justify-self-start" />

          <nav className="hidden items-center gap-1 md:flex" aria-label="Landing sections">
            {links.map((l) => (
              <a
                key={l.id}
                href={`#${l.id}`}
                onClick={(e) => {
                  e.preventDefault()
                  goTo(l.id)
                }}
                className="rounded-full hover:bg-white/10 px-3.5 py-2 text-sm
                hover:backdrop-blur-sm text-fg-muted transition-all hover:text-fg"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="col-start-3 flex items-center justify-self-end">
            {/* Обёртка, а не hidden на самих контролах: их собственные
                display-утилиты (flex/inline-flex) перебивают hidden */}
            <div className="hidden md:block">
              {session ? (
                <ProfilePill nickname={session.nickname} />
              ) : (
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-white/5! backdrop-blur-md rounded-full flex gap-1.5"
                  onClick={() => navigate('/login')}
                >
                  <LogIn size={14}/>
                  Log in
                </Button>
              )}
            </div>
            <button
              type="button"
              aria-label="Open menu"
              aria-expanded={open}
              onClick={() => setOpen(true)}
              className="-mr-2 flex size-10 cursor-pointer items-center justify-center text-fg md:hidden"
            >
              <Menu size={20} strokeWidth={1.75} aria-hidden />
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="fixed inset-0 z-50 flex flex-col bg-black/70 backdrop-blur-2xl md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.25 }}
          >
            <div className="flex h-16 items-center justify-between px-6">
              <Wordmark onClick={() => setOpen(false)} />
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="-mr-2 flex size-10 cursor-pointer items-center justify-center text-fg"
              >
                <X size={20} strokeWidth={1.75} aria-hidden />
              </button>
            </div>

            <nav className="flex flex-1 flex-col justify-center gap-2 px-8" aria-label="Landing sections">
              {links.map((l, i) => (
                <motion.a
                  key={l.id}
                  href={`#${l.id}`}
                  onClick={(e) => {
                    e.preventDefault()
                    goTo(l.id)
                  }}
                  className="py-2 text-3xl font-semibold tracking-tight"
                  initial={reduced ? { opacity: 0 } : { opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.08 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                >
                  {l.label}
                </motion.a>
              ))}
            </nav>

            <motion.div
              className="px-8 pb-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              {session ? (
                <ProfilePill nickname={session.nickname} className="w-fit" />
              ) : (
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => {
                    setOpen(false)
                    navigate('/login')
                  }}
                >
                  Log in
                </Button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
