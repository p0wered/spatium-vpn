import type { ComponentPropsWithoutRef } from 'react'

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

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}{...props} />
  )
}
