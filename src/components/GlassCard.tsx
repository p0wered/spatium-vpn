import { useRef, type ComponentPropsWithoutRef, type MouseEvent } from 'react'

type GlassCardProps = ComponentPropsWithoutRef<'div'> & {
  /**
   * Внешний ореол свечения у края возле курсора (по мотивам React Bits
   * BorderGlow). Опционален: для featured-карточек, не для всего bento.
   */
  halo?: boolean
}

/**
 * Базовая «стеклянная» карточка дизайн-системы: фон surface-1, градиентный
 * бордер «свет сверху» и spotlight-подсветка, следующая за курсором.
 * Визуальная часть — в index.css (.glass-card, .glass-card-halo), здесь только
 * трекинг мыши через CSS-переменные, без React-state и ре-рендеров.
 */
export function GlassCard({
  halo = false,
  className = '',
  children,
  onMouseMove,
  onMouseEnter,
  onMouseLeave,
  ...props
}: GlassCardProps) {
  const ref = useRef<HTMLDivElement>(null)

  const setVar = (name: string, value: string) => ref.current?.style.setProperty(name, value)

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect()
    if (rect) {
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      setVar('--spot-x', `${x}px`)
      setVar('--spot-y', `${y}px`)

      if (halo) {
        const dx = x - rect.width / 2
        const dy = y - rect.height / 2
        let deg = Math.atan2(dy, dx) * (180 / Math.PI) + 90
        if (deg < 0) deg += 360
        const kx = dx === 0 ? Infinity : rect.width / 2 / Math.abs(dx)
        const ky = dy === 0 ? Infinity : rect.height / 2 / Math.abs(dy)
        const proximity = Math.min(Math.max(1 / Math.min(kx, ky), 0), 1)
        const sensitivity = 30
        const opacity = Math.max(0, (proximity * 100 - sensitivity) / (100 - sensitivity))
        setVar('--halo-angle', `${deg.toFixed(1)}deg`)
        setVar('--halo-opacity', opacity.toFixed(3))
      }
    }
    onMouseMove?.(e)
  }

  return (
    <div
      ref={ref}
      className={`glass-card ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={(e) => {
        setVar('--spot-opacity', '1')
        onMouseEnter?.(e)
      }}
      onMouseLeave={(e) => {
        setVar('--spot-opacity', '0')
        setVar('--halo-opacity', '0')
        onMouseLeave?.(e)
      }}
      {...props}
    >
      {halo && (
        <span aria-hidden className="glass-card-halo">
          <span />
        </span>
      )}
      {children}
    </div>
  )
}
