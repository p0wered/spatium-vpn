import Strands from '../../components/backgrounds/Strands'

const parsedTime = Number(new URLSearchParams(window.location.search).get('time') ?? 3.2)
const staticTime = Number.isFinite(parsedTime) ? parsedTime : 3.2

/** Чистый прозрачный canvas с desktop-настройками Strands из Hero. */
export function StrandsExportPage() {
  return (
    <main className="fixed inset-0 overflow-hidden bg-transparent">
      <Strands
        colors={['#b4d2ff', '#426eff', '#ffffff']}
        count={5}
        speed={0.35}
        thickness={0.5}
        glow={2}
        intensity={0.55}
        scale={1.95}
        staticTime={staticTime}
        preserveDrawingBuffer
      />
    </main>
  )
}
