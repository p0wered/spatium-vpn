import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router'
import {
  CreditCard,
  Globe,
  LayoutGrid,
  LogOut,
  Menu,
  MonitorSmartphone,
  PanelLeftClose,
  PanelLeftOpen,
  Rocket,
  Settings,
  X,
} from 'lucide-react'
import { ToastProvider } from '../../components/Toast'
import { Wordmark } from '../../components/Wordmark'
import { signOut } from '../../lib/session'
import { DashboardProvider, useDashboard } from './DashboardContext'

const navItems = [
  { to: '/dashboard', label: 'Overview', icon: LayoutGrid, end: true },
  { to: '/dashboard/devices', label: 'Devices', icon: MonitorSmartphone },
  { to: '/dashboard/setup', label: 'Setup', icon: Rocket },
  { to: '/dashboard/subscription', label: 'Subscription', icon: CreditCard },
  { to: '/dashboard/servers', label: 'Servers', icon: Globe },
  { to: '/dashboard/settings', label: 'Settings', icon: Settings },
]

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

/** Ширина сайдбара: развёрнутый / схлопнутый до колонки иконок (16 + 44 + 16). */
const SIDEBAR_W = { expanded: 240, collapsed: 76 }

/** Всё, что меняет геометрию оболочки, едет одним таймингом — иначе части разъезжаются. */
const shellTransition = (reduced: boolean | null) =>
  reduced ? { duration: 0 } : { duration: 0.34, ease: EASE }

/**
 * Подписи гаснут быстро при схлопывании и проявляются с задержкой при раскрытии —
 * чтобы текст не «резался» краем сайдбара на полпути.
 */
const labelTransition = (reduced: boolean | null, collapsed: boolean) =>
  reduced ? { duration: 0 } : collapsed ? { duration: 0.12 } : { duration: 0.22, delay: 0.16 }

function NavItems({ collapsed = false, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const reduced = useReducedMotion()

  return (
    <ul className="flex flex-col gap-1">
      {navItems.map(({ to, label, icon: Icon, end }) => (
        <li key={to}>
          {/*
            px-3 держится в обоих состояниях: иконка стоит на одном и том же месте,
            а пилюля просто сжимается вместе с сайдбаром и подрезает подпись.
          */}
          <NavLink
            to={to}
            end={end}
            title={collapsed ? label : undefined}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex h-11 items-center gap-3 overflow-hidden rounded-xl px-3 text-sm transition-colors ${
                isActive
                  ? 'bg-surface-2 text-fg'
                  : 'text-fg-muted hover:bg-surface-1 hover:text-fg'
              }`
            }
          >
            <Icon size={18} strokeWidth={1.75} className="sidebar-nav-icon shrink-0" aria-hidden />
            <motion.span
              initial={false}
              animate={{ opacity: collapsed ? 0 : 1 }}
              transition={labelTransition(reduced, collapsed)}
              className="whitespace-nowrap"
            >
              {label}
            </motion.span>
          </NavLink>
        </li>
      ))}
    </ul>
  )
}

function UserChip({ collapsed = false }: { collapsed?: boolean }) {
  const { nickname, email } = useDashboard()
  const navigate = useNavigate()
  const reduced = useReducedMotion()
  const transition = shellTransition(reduced)

  return (
    <motion.div
      initial={false}
      animate={{ height: collapsed ? 84 : 36 }}
      transition={transition}
      className="relative overflow-hidden"
    >
      {/*
        Ряд «аватар + имя» держит фиксированную ширину развёрнутого сайдбара,
        поэтому при схлопывании он не переверстывается — его просто подрезает край.
      */}
      <div className="absolute top-0 left-0 flex h-9 w-full items-center gap-3 lg:w-52">
        <motion.span
          aria-hidden
          initial={false}
          animate={{ marginLeft: collapsed ? 3 : 0 }}
          transition={transition}
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-sm font-medium uppercase"
        >
          {nickname[0]}
        </motion.span>
        <motion.span
          initial={false}
          animate={{ opacity: collapsed ? 0 : 1 }}
          transition={labelTransition(reduced, collapsed)}
          className="min-w-0 flex-1 leading-tight"
        >
          <span className="block truncate text-sm">{nickname}</span>
          <span className="block truncate text-xs text-fg-muted">{email}</span>
        </motion.span>
        <span aria-hidden className="size-9 shrink-0" />
      </div>
      {/* Выход: справа от чипа в развёрнутом виде, под аватаром — в колонке иконок. */}
      <motion.button
        type="button"
        title="Log out"
        onClick={() => {
          signOut()
          navigate('/')
        }}
        initial={false}
        animate={{ right: collapsed ? 4 : 0, top: collapsed ? 48 : 0 }}
        transition={transition}
        className="absolute flex size-9 cursor-pointer items-center justify-center rounded-lg text-fg-muted transition-colors hover:text-fg"
      >
        <LogOut size={16} strokeWidth={1.75} aria-hidden />
        <span className="sr-only">Log out</span>
      </motion.button>
    </motion.div>
  )
}

function DashboardShell() {
  const [collapsed, setCollapsed] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const reduced = useReducedMotion()

  return (
    <div className="flex min-h-screen">
      {/* Sidebar — десктоп */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? SIDEBAR_W.collapsed : SIDEBAR_W.expanded }}
        transition={shellTransition(reduced)}
        className="sticky top-0 hidden h-screen shrink-0 flex-col overflow-hidden border-r border-white/6 px-4 py-6 lg:flex"
      >
        <div className="relative h-9 shrink-0">
          <motion.div
            initial={false}
            animate={{ opacity: collapsed ? 0 : 1 }}
            transition={labelTransition(reduced, collapsed)}
            className="absolute top-0 left-3 flex h-9 w-max items-center"
          >
            <Wordmark />
          </motion.div>
          <motion.button
            type="button"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={() => setCollapsed((v) => !v)}
            initial={false}
            animate={{ right: collapsed ? 4 : 0 }}
            transition={shellTransition(reduced)}
            className="absolute top-0 flex size-9 cursor-pointer items-center justify-center rounded-lg text-fg-muted transition-colors hover:text-fg"
          >
            {/* Иконки лежат стопкой и перекрещиваются — иначе подмена читается как рывок. */}
            <span className="relative block size-[18px]">
              <motion.span
                initial={false}
                animate={{ opacity: collapsed ? 0 : 1 }}
                transition={{ duration: reduced ? 0 : 0.18 }}
                className="absolute inset-0"
              >
                <PanelLeftClose size={18} strokeWidth={1.75} aria-hidden />
              </motion.span>
              <motion.span
                initial={false}
                animate={{ opacity: collapsed ? 1 : 0 }}
                transition={{ duration: reduced ? 0 : 0.18 }}
                className="absolute inset-0"
              >
                <PanelLeftOpen size={18} strokeWidth={1.75} aria-hidden />
              </motion.span>
            </span>
            <span className="sr-only">{collapsed ? 'Expand sidebar' : 'Collapse sidebar'}</span>
          </motion.button>
        </div>
        <nav className="mt-8 flex-1">
          <NavItems collapsed={collapsed} />
        </nav>
        <UserChip collapsed={collapsed} />
      </motion.aside>

      {/* Топ-бар — мобила */}
      <div className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-white/6 bg-bg/80 px-4 backdrop-blur-xl lg:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="cursor-pointer rounded-lg p-2 text-fg-muted transition-colors hover:text-fg"
        >
          <Menu size={20} strokeWidth={1.75} aria-hidden />
          <span className="sr-only">Open menu</span>
        </button>
        <Wordmark />
        <span className="w-9" aria-hidden />
      </div>

      {/* Drawer — мобила */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={shellTransition(reduced)}
            onClick={() => setDrawerOpen(false)}
          >
            <motion.aside
              className="flex h-full w-72 flex-col border-r border-white/6 bg-bg px-4 py-6"
              initial={reduced ? { opacity: 0 } : { x: '-100%' }}
              animate={reduced ? { opacity: 1 } : { x: 0 }}
              exit={reduced ? { opacity: 0 } : { x: '-100%' }}
              transition={shellTransition(reduced)}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pl-3">
                <Wordmark />
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="cursor-pointer rounded-lg p-2 text-fg-muted transition-colors hover:text-fg"
                >
                  <X size={18} strokeWidth={1.75} aria-hidden />
                  <span className="sr-only">Close menu</span>
                </button>
              </div>
              <nav className="mt-8 flex-1">
                <NavItems onNavigate={() => setDrawerOpen(false)} />
              </nav>
              <UserChip />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative min-w-0 flex-1 px-5 pt-20 pb-10 lg:px-10 lg:pt-10">
        <div className="relative mx-auto max-w-5xl">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export function DashboardLayout() {
  return (
    <DashboardProvider>
      <ToastProvider>
        <DashboardShell />
      </ToastProvider>
    </DashboardProvider>
  )
}
