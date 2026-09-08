import { useRef, type ComponentPropsWithoutRef, type MouseEvent } from 'react'

type GlassCardProps = ComponentPropsWithoutRef<'div'> & {
  /**
   * Внешний ореол свечения у края возле курсора (по мотивам React Bits
   * BorderGlow). Включён по умолчанию; halo={false} отключает эффект.
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
  halo = true,
  className = '',
  children,
  onMouseMove,
  onMouseEnter,
  onMouseLeave,
  ...props
}: GlassCardProps) {
  const ref = useRef<HTMLDivElement>(null)

  const setVar = (name: string, value: string) => ref.current?.style.setProperty(name, value)

  const updateLight = (e: MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect()
    if (rect) {
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      setVar('--spot-x', `${x}px`)
      setVar('--spot-y', `${y}px`)

      if (halo) {
        // Fixed CSS-pixel reach keeps the same falloff on every card size.
        const edgeDistance = Math.max(0, Math.min(x, y, rect.width - x, rect.height - y))
        const opacity = Math.max(0, 1 - edgeDistance / 80)
        setVar('--halo-opacity', opacity.toFixed(3))
      }
    }
  }

  return (
    <div
      ref={ref}
      className={`glass-card ${className}`}
      onMouseMove={(e) => {
        updateLight(e)
        onMouseMove?.(e)
      }}
      onMouseEnter={(e) => {
        updateLight(e)
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
