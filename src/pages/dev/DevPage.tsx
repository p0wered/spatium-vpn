import { Link } from 'react-router'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
import { GlassCard } from '../../components/GlassCard'
import { GrainOverlay } from '../../components/GrainOverlay'

/**
 * Песочница дизайн-системы (только dev-сборка, см. router.tsx).
 * Здесь визуально проверяются токены и компоненты до использования в продукте.
 */

const colors = [
  { name: 'bg', className: 'bg-bg' },
  { name: 'surface-1', className: 'bg-surface-1' },
  { name: 'surface-2', className: 'bg-surface-2' },
  { name: 'fg', className: 'bg-fg' },
  { name: 'fg-muted', className: 'bg-fg-muted' },
  { name: 'ice', className: 'bg-ice' },
  { name: 'beam', className: 'bg-beam' },
]

export function DevPage() {
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-14 px-6 py-12">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Design system sandbox</h1>
        <p className="mt-2 text-fg-muted">Токены и компоненты SpatiumVPN. Только для разработки.</p>
        <Link
          to="/dev/backgrounds"
          className="mt-3 inline-block text-sm text-ice transition-opacity hover:opacity-80"
        >
          Hero backgrounds — сравнение кандидатов →
        </Link>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-medium">GlassCard — материал</h2>
        <p className="text-sm text-fg-muted">
          Градиентный бордер «свет сверху» + spotlight за курсором (фон и рамка).
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {/* Типографская карточка (основной тип для bento) */}
          <GlassCard className="p-6 sm:col-span-2">
            <h3 className="text-2xl font-semibold tracking-tight">No-logs by design</h3>
            <p className="mt-2 text-sm text-fg-muted">
              We physically can't hand over what we never store. RAM-only servers, zero persistence.
            </p>
          </GlassCard>

          {/* Стат-карточка с glow-цифрой (CSS вместо 3D-ассета) */}
          <GlassCard className="flex flex-col items-center justify-center gap-1 p-6">
            <span className="font-mono text-4xl font-semibold text-fg [text-shadow:0_0_32px_rgb(255_255_255/0.45)]">
              12<span className="text-2xl">ms</span>
            </span>
            <span className="text-sm text-fg-muted">gaming ping</span>
          </GlassCard>

          {/* Карточка с grain + вложенным surface-2 */}
          <GlassCard className="relative overflow-hidden p-6">
            <GrainOverlay />
            <h3 className="font-semibold tracking-tight">Grain inside</h3>
            <p className="mt-2 text-sm text-fg-muted">Шум поверх карточки, opacity 0.04.</p>
          </GlassCard>

          <GlassCard className="p-6 sm:col-span-2">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold tracking-tight">Nested surface</h3>
                <p className="mt-1 text-sm text-fg-muted">surface-2 внутри карточки</p>
              </div>
              <div className="rounded-xl bg-surface-2 px-4 py-3 font-mono text-sm text-fg-muted">
                nl-ams-01 · 8 ms
              </div>
            </div>
          </GlassCard>

          {/* Внешний ореол (halo) — для featured-карточек */}
          <GlassCard
            halo
            className="flex flex-col items-center gap-2 p-10 text-center sm:col-span-3"
          >
            <h3 className="text-2xl font-semibold tracking-tight">Halo edge</h3>
            <p className="max-w-sm text-sm text-fg-muted">
              Внешний ореол у края возле курсора (проп <code className="font-mono">halo</code>).
              Подведи курсор к границе карточки.
            </p>
          </GlassCard>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-medium">Buttons</h2>
        <div className="flex flex-wrap items-center gap-4">
          <Button size="lg">Get SpatiumVPN</Button>
          <Button>Get SpatiumVPN</Button>
          <Button variant="secondary">View pricing</Button>
          <Button variant="ghost">Learn more</Button>
          <Button disabled>Disabled</Button>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-medium">Inputs — floating label</h2>
        <div className="grid max-w-xl grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Email" type="email" />
          <Input label="Nickname" defaultValue="neon-fox" />
          <Input label="Password" type="password" />
          <Input label="Email" defaultValue="powered.ui@gmail.com" disabled />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-medium">Grain — hero-фрагмент</h2>
        <div className="relative flex h-64 flex-col items-center justify-center overflow-hidden rounded-card-lg">
          {/* имитация свечения будущего hero-фона */}
          <div className="absolute inset-0 bg-[radial-gradient(600px_circle_at_50%_120%,--alpha(var(--color-beam)/25%),transparent_70%)]" />
          <GrainOverlay opacity={0.05} />
          <h3 className="text-4xl font-semibold tracking-tight">Beyond borders.</h3>
          <p className="mt-2 text-fg-muted">Grain 0.05 + свечение beam снизу</p>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-medium">Colors</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {colors.map((c) => (
            <div key={c.name} className="flex items-center gap-3">
              <div className={`size-12 rounded-xl border border-surface-2 ${c.className}`} />
              <span className="font-mono text-sm text-fg-muted">{c.name}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-medium">Typography</h2>
        <p className="text-5xl font-semibold tracking-tight">Beyond borders. Съешь ещё.</p>
        <p className="text-fg-muted">
          Secondary text — descriptions and captions. Вторичный текст для описаний.
        </p>
        <p className="font-mono text-sm">
          geist mono · 51.210.14.88 · 12 ms · 1.4 TB · Съешь ещё этих мягких французских булок
        </p>
      </section>
    </main>
  )
}
