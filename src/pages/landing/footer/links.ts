export type FooterLinkItem =
  /** Якорь секции лендинга — скроллим через scrollToSection */
  | { label: string; section: string }
  /** Внутренний роут приложения */
  | { label: string; to: string }
  /** Внешняя ссылка или mailto */
  | { label: string; href: string }

export type FooterGroup = { title: string; links: FooterLinkItem[] }

// Заглушки: реальных канала и ящика у pet-проекта нет
export const SUPPORT_TELEGRAM = { handle: '@spatium_support', href: 'https://t.me/spatium_support' }
export const SUPPORT_EMAIL = 'support@spatium.vpn'

export const footerGroups: FooterGroup[] = [
  {
    title: 'Product',
    links: [
      { label: 'Features', section: 'features' },
      { label: 'Privacy', section: 'privacy' },
      { label: 'Reviews', section: 'testimonials' },
      { label: 'Pricing', section: 'pricing' },
    ],
  },
  {
    title: 'Download',
    links: [
      { label: 'iOS', to: '/dashboard/setup' },
      { label: 'Android', to: '/dashboard/setup' },
      { label: 'macOS', to: '/dashboard/setup' },
      { label: 'Windows', to: '/dashboard/setup' },
      { label: 'Linux', to: '/dashboard/setup' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Telegram', href: SUPPORT_TELEGRAM.href },
      { label: 'Email', href: `mailto:${SUPPORT_EMAIL}` },
      { label: 'Setup guide', to: '/dashboard/setup' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy policy', to: '/legal/privacy' },
      { label: 'Terms of service', to: '/legal/terms' },
      { label: 'Plan terms', to: '/pricing/terms' },
    ],
  },
]

export const STATUS_LABEL = 'All systems operational'
