import { InputHalo } from '../../components/Input'
import { useState } from 'react'
import { Link } from 'react-router'
import { Check, Laptop, Monitor, Pencil, Smartphone, Terminal, Trash2, Tv } from 'lucide-react'
import { GlassCard } from '../../components/GlassCard'
import { Reveal } from '../../components/Reveal'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { useToast } from '../../components/Toast'
import { plan, type Device, type DeviceOS } from '../../data/mock'
import { formatDateFull, formatGB, relativeTime } from '../../lib/format'
import { useDashboard } from './DashboardContext'
import { PageHeader } from './PageHeader'

const osIcons: Record<DeviceOS, typeof Laptop> = {
  macos: Laptop,
  ios: Smartphone,
  windows: Monitor,
  android: Smartphone,
  linux: Terminal,
  tv: Tv,
}

function DeviceRow({
  device,
  share,
  onRevoke,
}: {
  device: Device
  /** Доля устройства в общем трафике аккаунта, 0–1 (мини-бар) */
  share: number
  onRevoke: () => void
}) {
  const { renameDevice } = useDashboard()
  const toast = useToast()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(device.name)
  const Icon = osIcons[device.os]

  const commit = () => {
    setEditing(false)
    const name = draft.trim()
    if (name && name !== device.name) {
      renameDevice(device.id, name)
      toast('Device renamed')
    } else {
      setDraft(device.name)
    }
  }

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-white/5 p-4 last:border-none">
      <span
        aria-hidden
        className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-2"
      >
        <Icon size={18} strokeWidth={1.75} className="text-fg-muted" />
      </span>

      <div className="min-w-0 flex-1 basis-40">
        {editing ? (
          <span className="input-halo-frame block w-full max-w-52 rounded-sm">
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commit()
                if (e.key === 'Escape') {
                  setDraft(device.name)
                  setEditing(false)
                }
              }}
              className="input-halo w-full rounded-sm text-sm"
            />
            <InputHalo />
          </span>
        ) : (
          <span className="flex items-center gap-2 text-sm">
            <span className="truncate">{device.name}</span>
            <button
              type="button"
              title="Rename"
              onClick={() => setEditing(true)}
              className="cursor-pointer p-1 text-fg-muted opacity-60 transition-opacity hover:opacity-100"
            >
              {editing ? <Check size={13} aria-hidden /> : <Pencil size={13} aria-hidden />}
              <span className="sr-only">Rename device</span>
            </button>
          </span>
        )}
        <span className="mt-0.5 block text-xs text-fg-muted">
          added {formatDateFull(device.firstConnected)}
        </span>
      </div>

      <div className="w-28 shrink-0 text-xs text-fg-muted">
        <span className="block text-fg-muted/70">last seen</span>
        <span className="font-mono text-fg">{relativeTime(device.lastSeen)}</span>
      </div>

      <div className="w-32 shrink-0">
        <span className="font-mono text-sm">{formatGB(device.trafficGB)}</span>
        <span
          className="mt-1.5 block h-[3px] overflow-hidden rounded-full bg-white/8"
          title={`${Math.round(share * 100)}% of account traffic`}
        >
          <span
            className="block h-full rounded-full bg-white/55"
            style={{ width: `${Math.max(share * 100, 2)}%` }}
          />
        </span>
      </div>

      <button
        type="button"
        title="Revoke device"
        onClick={onRevoke}
        className="cursor-pointer rounded-lg p-2 text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
      >
        <Trash2 size={16} strokeWidth={1.75} aria-hidden />
        <span className="sr-only">Revoke device</span>
      </button>
    </li>
  )
}

export function DevicesPage() {
  const { devices, revokeDevice } = useDashboard()
  const toast = useToast()
  const [revoking, setRevoking] = useState<Device | null>(null)

  const totalGB = devices.reduce((sum, d) => sum + d.trafficGB, 0)

  return (
    <div className="flex flex-col gap-6">
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <PageHeader
            title="Devices"
            sub="Everything connected with your subscription link, identified by device ID."
          />
          {/* Индикатор лимита тарифа: занятые слоты — мостик к Subscription */}
          <div className="pr-2">
            <span className="font-mono text-sm">
              {devices.length}
              <span className="text-fg-muted"> of {plan.deviceLimit} devices</span>
            </span>
            <span className="mt-2 flex gap-1" aria-hidden>
              {Array.from({ length: plan.deviceLimit }, (_, i) => (
                <span
                  key={i}
                  className={`h-1 w-6 rounded-full ${i < devices.length ? 'bg-white/60' : 'bg-white/10'}`}
                />
              ))}
            </span>
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        {devices.length > 0 ? (
          <GlassCard>
            <ul>
              {devices.map((d) => (
                <DeviceRow
                  key={d.id}
                  device={d}
                  share={totalGB > 0 ? d.trafficGB / totalGB : 0}
                  onRevoke={() => setRevoking(d)}
                />
              ))}
            </ul>
          </GlassCard>
        ) : (
          <GlassCard className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <p className="text-sm text-fg-muted">No devices connected yet.</p>
            <Link to="/dashboard/setup" className="text-sm underline underline-offset-4">
              Set up your first device
            </Link>
          </GlassCard>
        )}
      </Reveal>

      <ConfirmDialog
        open={revoking !== null}
        title={`Revoke ${revoking?.name ?? 'device'}?`}
        description="The device will be disconnected and its access key invalidated. You can reconnect it later with your subscription link."
        confirmLabel="Revoke"
        onConfirm={() => {
          if (revoking) {
            revokeDevice(revoking.id)
            toast('Device revoked')
          }
        }}
        onClose={() => setRevoking(null)}
      />
    </div>
  )
}
