import { Link } from 'react-router'
import { ArrowUpRight } from 'lucide-react'
import { scrollToSection } from '../../../lib/scroll'
import type { FooterLinkItem } from './links'

const base =
  'inline-flex items-center gap-1 rounded-sm transition-colors duration-200 ' +
  'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-fg'

/** Ссылка футера: якорь секции, роут или внешний адрес — по форме данных */
export function FooterLink({ link, className = '' }: { link: FooterLinkItem; className?: string }) {
  const cls = `${base} ${className}`

  if ('section' in link) {
    // Вне лендинга (страницы документов) секции нет — тогда обычный переход
    // на /#id, браузер сам доскроллит после загрузки
    return (
      <a
        href={`/#${link.section}`}
        className={cls}
        onClick={(e) => {
          if (!document.getElementById(link.section)) return
          e.preventDefault()
          scrollToSection(link.section)
        }}
      >
        {link.label}
      </a>
    )
  }

  if ('to' in link) {
    return (
      <Link to={link.to} className={cls}>
        {link.label}
      </Link>
    )
  }

  const external = link.href.startsWith('http')
  return (
    <a
      href={link.href}
      className={cls}
      {...(external && { target: '_blank', rel: 'noreferrer' })}
    >
      {link.label}
      {external && <ArrowUpRight size={13} strokeWidth={1.75} aria-hidden className="opacity-50" />}
    </a>
  )
}

/** Пульсирующая точка статуса — ледяной свет, а не «зелёный светофор» */
export function StatusDot() {
  return (
    <span className="relative flex size-1.5 shrink-0" aria-hidden>
      <span className="absolute inset-0 animate-ping rounded-full bg-ice/60 motion-reduce:hidden" />
      <span className="size-1.5 rounded-full bg-ice shadow-[0_0_8px] shadow-ice" />
    </span>
  )
}
