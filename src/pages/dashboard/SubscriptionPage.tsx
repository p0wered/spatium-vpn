import { InputHalo } from '../../components/Input'
import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Copy, RotateCcw } from 'lucide-react'
import { Button } from '../../components/Button'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { GlassCard } from '../../components/GlassCard'
import { Reveal } from '../../components/Reveal'
import { useToast } from '../../components/Toast'
import { plan, subLink } from '../../data/mock'
import { formatDateFull, formatMoney } from '../../lib/format'
import { useDashboard } from './DashboardContext'
import { PageHeader } from './PageHeader'

function TopUpDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { topUp } = useDashboard()
  const toast = useToast()
  const [preset, setPreset] = useState(10)
  const [custom, setCustom] = useState('')
  const reduced = useReducedMotion()

  const amount = custom === '' ? preset : Number(custom)
  const submit = () => {
    topUp(amount)
    toast(`Balance topped up by $${amount}`)
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-6 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal
            aria-label="Top up balance"
            className="glass-card w-full max-w-sm p-7"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold tracking-tight">Top up balance</h2>
            <p className="mt-1 text-sm leading-relaxed text-fg-muted">
              Demo project — no real payments. The amount is credited instantly.
            </p>
            <div className="mt-3 flex gap-2">
              {[5, 10, 25].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => {
                    setPreset(v)
                    setCustom('')
                  }}
                  className={`cursor-pointer rounded-xl border px-5 py-2.5 font-mono text-sm transition-colors ${
                    custom === '' && preset === v
                      ? 'border-white/25 bg-white/12 text-fg'
                      : 'border-white/8 text-fg-muted hover:text-fg'
                  }`}
                >
                  ${v}
                </button>
              ))}
              <div className="input-halo-frame min-w-0 flex-1 rounded-xl">
                {custom !== '' && (
                  <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center font-mono text-sm text-fg">
                    $
                  </span>
                )}
                <input
                  value={custom}
                  onChange={(e) =>
                    setCustom(e.target.value.replace(/\D/g, '').replace(/^0+/, '').slice(0, 3))
                  }
                  onKeyDown={(e) => e.key === 'Enter' && submit()}
                  inputMode="numeric"
                  placeholder="Custom"
                  aria-label="Custom amount in dollars"
                  className={`input-halo w-full rounded-xl border py-2.5 pr-4 font-mono text-sm text-fg placeholder:text-fg-muted ${
                    custom !== '' ? 'border-white/25 bg-white/12 pl-7' : 'border-white/8 pl-4'
                  }`}
                />
                <InputHalo />
              </div>
            </div>
            <div className="w-full mt-8 flex justify-between gap-2">
              <Button className="px-8" onClick={submit}>
                Add ${amount}
              </Button>
              <Button
                className="px-4"
                variant="ghost"
                onClick={onClose}
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function SubscriptionPage() {
  const { balance, expiresAt, transactions, subToken, resetSubToken } = useDashboard()
  const toast = useToast()
  const [topUpOpen, setTopUpOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)

  const link = subLink(subToken)
  const copyLink = () => {
    void navigator.clipboard.writeText(link)
    toast('Subscription link copied')
  }

  return (
    <div className="flex flex-col gap-6">
      <Reveal>
        <PageHeader title="Subscription" sub={`${plan.name} · billed daily from your balance`} />
      </Reveal>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="flex flex-col gap-4 xl:col-span-2">
          {/* Баланс и тариф */}
          <Reveal delay={0.05}>
            <GlassCard className="p-6 lg:p-7">
              <div className="flex flex-wrap items-end justify-between gap-5">
                <div>
                  <div className="text-xs text-fg-muted">Balance</div>
                  <div className={`mt-2 font-mono text-4xl tracking-tight`}>
                    {formatMoney(balance)}
                  </div>
                  <div className="mt-2 text-sm text-fg-muted">
                    {formatMoney(plan.dailyRate)} per day · until{' '}
                    <span className="font-mono text-fg-muted">{formatDateFull(expiresAt)}</span>
                  </div>
                </div>
                <Button
                  className="px-8"
                  onClick={() => setTopUpOpen(true)}
                >
                  Top up
                </Button>
              </div>
            </GlassCard>
          </Reveal>

          {/* История транзакций */}
          <Reveal delay={0.1}>
            <GlassCard className="p-6 lg:p-7">
              <h2 className="text-sm font-medium">Billing history</h2>
              <ul className="mt-3">
                {transactions.slice(0, 10).map((tx) => (
                  <li
                    key={tx.id}
                    className="flex items-baseline gap-4 border-b border-white/5 py-2.5 text-sm last:border-none"
                  >
                    <span className="w-16 shrink-0 font-mono text-xs text-fg-muted">
                      {formatDateFull(tx.date).replace(', 2026', '')}
                    </span>
                    <span className="flex-1 text-fg-muted">{tx.label}</span>
                    <span className={`font-mono ${tx.amount > 0 ? `text-fg` : 'text-fg-muted'}`}>
                      {tx.amount > 0 ? '+' : ''}
                      {formatMoney(tx.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            </GlassCard>
          </Reveal>
        </div>

        {/* Ссылка-подписка + QR */}
        <Reveal delay={0.15}>
          <GlassCard className="flex flex-col pb-2 lg:pb-3 p-6 lg:p-7">
            <h2 className="text-sm font-medium">Subscription link</h2>
            <p className="mt-1 text-xs leading-relaxed text-fg-muted">
              Paste it into any client — or scan the QR.
            </p>
            <div className="mt-4 flex items-center justify-center rounded-2xl bg-surface-2 py-6">
              <QRCodeSVG
                value={link}
                size={164}
                level="M"
                marginSize={4}
                bgColor="#ffffff"
                fgColor="#151515"
                className="rounded-lg"
                role="img"
                aria-label="Subscription QR code"
              />
            </div>
            <code className="mt-4 block truncate rounded-xl bg-surface-2 px-3.5 py-2.5 font-mono text-xs text-fg-muted">
              {link}
            </code>
            <div className="mt-4 flex flex-col gap-2">
              <Button variant="secondary" onClick={copyLink}>
                <Copy size={14} strokeWidth={1.75} className="mr-2" aria-hidden />
                Copy link
              </Button>
              <Button variant="ghost" onClick={() => setResetOpen(true)}>
                <RotateCcw size={14} strokeWidth={1.75} className="mr-2" aria-hidden />
                Reset link
              </Button>
            </div>
          </GlassCard>
        </Reveal>
      </div>

      <TopUpDialog open={topUpOpen} onClose={() => setTopUpOpen(false)} />
      <ConfirmDialog
        open={resetOpen}
        title="Reset subscription link?"
        description="A new link will be generated. The old one stops working immediately — every connected device will need the new link."
        confirmLabel="Reset link"
        onConfirm={() => {
          resetSubToken()
          toast('New subscription link generated')
        }}
        onClose={() => setResetOpen(false)}
      />
    </div>
  )
}
