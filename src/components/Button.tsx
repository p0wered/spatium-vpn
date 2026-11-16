import type { ComponentPropsWithoutRef, MouseEvent } from 'react'

type ButtonProps = ComponentPropsWithoutRef<'button'> & {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

const base =
  'inline-flex cursor-pointer items-center justify-center rounded-2xl font-medium tracking-tight ' +
  'transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg ' +
  'active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40'

const variants = {
  primary: 'btn-glow bg-fg text-black shadow-[0_0_20px] shadow-ice/20 hover:bg-white',
  secondary: 'border border-white/10 bg-white/8 text-fg hover:border-white/14 hover:bg-white/14',
  ghost: 'text-fg-muted hover:text-fg',
}

const sizes = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-13 px-7 text-base',
}

/** Позиция курсора для пятна свечения primary — через CSS-переменные, без ре-рендеров. */
function trackSpot(e: MouseEvent<HTMLButtonElement>) {
  const el = e.currentTarget
  const rect = el.getBoundingClientRect()
  el.style.setProperty('--spot-x', `${e.clientX - rect.left}px`)
  el.style.setProperty('--spot-y', `${e.clientY - rect.top}px`)
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  onMouseMove,
  onMouseEnter,
  ...props
}: ButtonProps) {
  const glow = variant === 'primary'
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      onMouseMove={(e) => {
        if (glow) trackSpot(e)
        onMouseMove?.(e)
      }}
      onMouseEnter={(e) => {
        if (glow) trackSpot(e)
        onMouseEnter?.(e)
      }}
      {...props}
    >
      {glow && (
        <span aria-hidden className="btn-glow-light">
          <span />
        </span>
      )}
      {children}
    </button>
  )
}
