/**
 * Едва заметный статичный grain.
 * SVG feTurbulence как data-URI тайл 128×128. Родитель должен быть relative;
 * оверлей не перехватывает клики и не анимируется.
 */

const noiseTile = encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128'>` +
    `<filter id='n'>` +
    `<feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/>` +
    `<feColorMatrix type='saturate' values='0'/>` +
    `</filter>` +
    `<rect width='100%' height='100%' filter='url(#n)'/>` +
    `</svg>`,
)

export function GrainOverlay({
  opacity = 0.04,
  className = '',
}: {
  opacity?: number
  className?: string
}) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 rounded-[inherit] ${className}`}
      style={{
        opacity,
        backgroundImage: `url("data:image/svg+xml,${noiseTile}")`,
        backgroundSize: '128px 128px',
      }}
    />
  )
}
