import { motion, useReducedMotion, type Variants } from 'motion/react'
import { Link, useNavigate } from 'react-router'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
import { signIn } from '../../lib/session'

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.12 } },
}

export function LoginPage() {
  const navigate = useNavigate()
  const reduced = useReducedMotion()

  const item: Variants = {
    hidden: reduced ? { opacity: 0 } : { opacity: 0, y: 14 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
    },
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <motion.form
        className="flex w-full max-w-sm flex-col gap-4"
        variants={container}
        initial="hidden"
        animate="show"
        onSubmit={(e) => {
          e.preventDefault()
          signIn()
          navigate('/dashboard')
        }}
      >
        {/* Вместо заголовка — знак проекта; «Sign in» остаётся для скринридеров */}
        <motion.div variants={item} className="mb-4 flex justify-center">
          <h1 className="sr-only">Sign in</h1>
          <Link
            to="/"
            aria-label="Spatium home"
            className="rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-fg"
          >
            <img src="/spatium-mark.svg" alt="" aria-hidden="true" className="h-8" />
          </Link>
        </motion.div>
        <motion.div variants={item}>
          <Input label="Email" type="email" autoComplete="email" />
        </motion.div>
        <motion.div variants={item}>
          <Input label="Password" type="password" autoComplete="current-password" />
        </motion.div>
        <motion.div variants={item} className="mt-2">
          <Button type="submit" className="w-full">
            Continue
          </Button>
        </motion.div>
      </motion.form>
    </main>
  )
}
