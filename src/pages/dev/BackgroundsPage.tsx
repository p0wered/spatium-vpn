import { lazy, Suspense, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { Button } from '../../components/Button'
import { GrainOverlay } from '../../components/GrainOverlay'

/**
 * Сравнение кандидатов WebGL-фона для Hero (только dev-сборка).
 * Каждый фон лениво грузится отдельным чанком — как и будет в проде.
 * Демо-контент Hero поверх, чтобы оценивать фон вместе с контентом.
 */

const LightRays = lazy(() => import('../../components/backgrounds/LightRays'))
const Strands = lazy(() => import('../../components/backgrounds/Strands'))
const ColorBends = lazy(() => import('../../components/backgrounds/ColorBends'))

const options: { name: string; node: ReactNode }[] = [
  {
    name: 'Light Rays',
    node: (
      <LightRays
        raysOrigin="top-center"
        raysColor="#f0f5ff"
        raysColor2="#78a2ff"
        raysSpeed={0.9}
        lightSpread={0.9}
        rayLength={1.6}
        followMouse
        mouseInfluence={0.08}
        noiseAmount={0.06}
        distortion={0.03}
      />
    ),
  },
  {
    name: 'Strands + glass',
    node: (
      <Strands
        colors={['#eaf2ff', '#426eff', '#ffffff']}
        count={5}
        speed={0.35}
        thickness={0.55}
        glow={2.2}
        intensity={0.55}
        scale={1.95}
        refraction={1}
        dispersion={1.2}
      />
    ),
  },
  {
    name: 'Color Bends',
    node: (
      <ColorBends
        colors={['#6086ff', '#080f2e', '#ffffff']}
        speed={0.12}
        intensity={1.05}
        noise={0.06}
        frequency={0.9}
        scale={1.15}
        parallax={0.4}
        mouseInfluence={0.5}
      />
    ),
  },
]

function HeroDemoContent() {
  return (
    <div className="relative z-10 flex h-full flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="max-w-4xl text-5xl font-semibold tracking-tighter text-balance [text-shadow:0_2px_32px_rgb(0_0_0/0.55)] sm:text-7xl">
        Move unseen. Arrive instantly.
      </h1>
      <p className="max-w-xl text-lg text-balance text-fg-muted [text-shadow:0_1px_16px_rgb(0_0_0/0.7)]">
        Fast, private VPN that just works — bypass censorship, stay anonymous, game on low-latency
        servers.
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <Button size="lg">Get SpatiumVPN</Button>
        <Button size="lg" variant="secondary">
          View pricing
        </Button>
      </div>
    </div>
  )
}

export function BackgroundsPage() {
  const [active, setActive] = useState(0)
  const [scrim, setScrim] = useState(true)

  return (
    <main className="relative h-screen overflow-hidden">
      <div className="absolute inset-0">
        <Suspense fallback={null}>{options[active].node}</Suspense>
      </div>
      <GrainOverlay />

      {/* Scrim: локальное затемнение за контентной зоной, гарантирует контраст
          белого текста на светлых участках анимированного фона */}
      {scrim && (
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(ellipse_55%_50%_at_50%_52%,rgb(0_0_0/0.5),transparent_72%)]"
        />
      )}

      <HeroDemoContent />

      <nav className="absolute top-6 left-1/2 z-20 flex -translate-x-1/2 gap-1 rounded-full border border-white/10 bg-white/5 p-1 backdrop-blur-md">
        {options.map((option, i) => (
          <button
            key={option.name}
            onClick={() => setActive(i)}
            className={`cursor-pointer rounded-full px-4 py-1.5 text-sm whitespace-nowrap transition-colors ${
              i === active ? 'bg-white/15 text-fg' : 'text-fg-muted hover:text-fg'
            }`}
          >
            {option.name}
          </button>
        ))}
      </nav>

      <Link
        to="/dev"
        className="absolute top-6 left-6 z-20 text-sm text-fg-muted transition-colors hover:text-fg"
      >
        ← sandbox
      </Link>

      <button
        onClick={() => setScrim((s) => !s)}
        className={`absolute top-6 right-6 z-20 cursor-pointer rounded-full border border-white/10 px-4 py-1.5 text-sm transition-colors ${
          scrim ? 'bg-white/15 text-fg' : 'bg-white/5 text-fg-muted hover:text-fg'
        }`}
      >
        scrim: {scrim ? 'on' : 'off'}
      </button>
    </main>
  )
}
