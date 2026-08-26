import { useState } from 'react'
import { Link } from 'react-router'
import { ArrowRight, Copy, Gamepad2, TriangleAlert } from 'lucide-react'
import { Flag } from '../../components/Flag'
import { GlassCard } from '../../components/GlassCard'
import { PillTabs } from '../../components/PillTabs'
import { Reveal } from '../../components/Reveal'
import { Button } from '../../components/Button'
import { useToast } from '../../components/Toast'
import { plan, recommendedServers, subLink, trafficDays } from '../../data/mock'
import { formatDateFull, formatGB, formatMoney } from '../../lib/format'
import { useDashboard } from './DashboardContext'
import { PageHeader } from './PageHeader'
import { TrafficChart } from './TrafficChart'

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <GlassCard className="p-5">
      <div>
        <div className="text-xs text-fg-muted">{label}</div>
        <div className={`mt-2 font-normal text-xl tracking-tight lg:text-2xl`}>{value}</div>
        <div className="mt-1.5 text-xs text-fg-muted">{sub}</div>
      </div>
    </GlassCard>
  )
}

function PeriodSwitch({ value, onChange }: { value: 7 | 30; onChange: (v: 7 | 30) => void }) {
  return (
    <PillTabs
      value={value}
      onChange={onChange}
      options={[
        { id: 7, label: '7d' },
        { id: 30, label: '30d' },
      ]}
      ariaLabel="Chart period"
      tabClassName="px-3.5 py-1.5 font-mono text-xs"
    />
  )
}

export function OverviewPage() {
  const { nickname, balance, daysLeft, expiresAt, devices, subToken } = useDashboard()
  const toast = useToast()
  const [period, setPeriod] = useState<7 | 30>(30)

  const days = trafficDays.slice(-period)
  const totalGB = days.reduce((sum, d) => sum + d.gb, 0)
  const nearest = recommendedServers(5)

  const copyLink = () => {
    void navigator.clipboard.writeText(subLink(subToken))
    toast('Subscription link copied')
  }

  return (
    <div className="flex flex-col gap-6">
      <Reveal>
        <PageHeader title="Overview" sub={`Welcome back, ${nickname}`} />
      </Reveal>

      {daysLeft <= 7 && (
        <Reveal delay={0.05}>
          <GlassCard className="flex flex-wrap items-center gap-3 px-5 py-4">
            <TriangleAlert size={17} strokeWidth={1.75} className="ml-2 shrink-0 text-fg" aria-hidden />
            <p className="min-w-0 flex-1 text-sm">
              Subscription expires in <span className="font-mono">{daysLeft} days</span>
              <span className="text-fg-muted"> — top up to keep your devices connected.</span>
            </p>
            <Link to="/dashboard/subscription">
              <Button variant="secondary" className="h-9 px-6">
                Top up
              </Button>
            </Link>
          </GlassCard>
        </Reveal>
      )}

      <Reveal delay={0.1}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Balance" value={formatMoney(balance)} sub={`≈ ${daysLeft} days of ${plan.name}`} />
          <StatCard label="Active until" value={formatDateFull(expiresAt)} sub={`${formatMoney(plan.dailyRate)} charged daily`} />
          <StatCard
            label="Devices"
            value={`${devices.length} of ${plan.deviceLimit}`}
            sub="connected to your plan"
          />
          <StatCard label={`Traffic · ${period}d`} value={formatGB(totalGB)} sub="through SpatiumVPN" />
        </div>
      </Reveal>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Reveal delay={0.15} className="xl:col-span-2">
          <GlassCard className="h-full p-5 lg:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold">Traffic</h2>
                <p className="mt-0.5 text-xs text-fg-muted">GB per day, last {period} days</p>
              </div>
              <PeriodSwitch value={period} onChange={setPeriod} />
            </div>
            <div className="mt-4">
              <TrafficChart days={days} />
            </div>
          </GlassCard>
        </Reveal>

        <Reveal delay={0.2}>
          <GlassCard className="flex h-full flex-col p-5 lg:p-6">
            <div>
              <h2 className="text-sm font-semibold">Recommended servers</h2>
              <p className="mt-0.5 text-xs text-fg-muted">nearest to you · estimated ping</p>
            </div>
            <ul className="mt-4 flex flex-1 flex-col">
              {nearest.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center gap-3 border-b border-white/5 py-2.5 last:border-none"
                >
                  <Flag code={s.code} size={14} />
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {s.city}
                    {s.type === 'gaming' && (
                      <Gamepad2
                        size={13}
                        strokeWidth={1.75}
                        className="mb-0.5 ml-1.5 inline text-fg-muted"
                        aria-label="gaming server"
                      />
                    )}
                  </span>
                  <span className="font-mono text-xs text-fg-muted">{s.load}%</span>
                  <span className={`w-14 text-right font-mono text-sm`}>{s.ping} ms</span>
                </li>
              ))}
            </ul>
            <Link
              to="/dashboard/servers"
              className="mt-3 inline-flex items-center gap-1.5 text-xs text-fg-muted transition-colors hover:text-fg"
            >
              All servers <ArrowRight size={13} aria-hidden />
            </Link>
          </GlassCard>
        </Reveal>
      </div>

      <Reveal delay={0.25}>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" onClick={copyLink}>
            <Copy size={15} strokeWidth={1.75} className="mr-2" aria-hidden />
            Copy subscription link
          </Button>
          <Link to="/dashboard/setup">
            <Button variant="ghost">Set up a device</Button>
          </Link>
        </div>
      </Reveal>
    </div>
  )
}
