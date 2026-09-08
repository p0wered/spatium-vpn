import { motion, useReducedMotion } from 'motion/react'
import { Link, useNavigate } from 'react-router'
import { LogIn } from 'lucide-react'
import { Button } from '../../components/Button'
import { GradualBlur } from '../../components/GradualBlur'
import { Wordmark } from '../../components/Wordmark'
import { useSession } from '../../lib/session'

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
 * Логотип слева, вход или профиль справа на всех размерах экрана.
 */
export function Header() {
  const session = useSession()
  const navigate = useNavigate()
  const reduced = useReducedMotion()
  return (
    <motion.header
      className="fixed inset-x-0 top-0 z-40"
      initial={{ opacity: 0, y: reduced ? 0 : -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <GradualBlur />

      <div className="landing-container relative flex h-16 items-center justify-between">
        <Wordmark />

        {session ? (
          <ProfilePill nickname={session.nickname} />
        ) : (
          <Button
            size="sm"
            variant="secondary"
            className="bg-white/5! backdrop-blur-md rounded-full flex gap-1.5"
            onClick={() => navigate('/login')}
          >
            <LogIn size={14} />
            Log in
          </Button>
        )}
      </div>
    </motion.header>
  )
}
