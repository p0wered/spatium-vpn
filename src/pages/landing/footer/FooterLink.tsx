import { Link } from 'react-router'
import { ArrowUpRight } from 'lucide-react'
import { scrollToSection } from '../../../lib/scroll'
import type { FooterLinkItem } from './links'

const base =
  'link-glow inline-flex items-center gap-1 rounded-sm ' +
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
