import { useEffect } from 'react'
import { Link } from 'react-router'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import { Header } from './Header'

const sections = [
  {
    id: 'billing',
    title: 'Daily billing & your balance',
    paragraphs: [
      'Your plan is charged daily from your account balance, whether or not you use the VPN. Billing cannot be paused.',
      'When your balance is insufficient, the VPN stops working and you are notified. You can enable automatic top-ups to keep your balance funded.',
    ],
  },
  {
    id: 'devices',
    title: 'One device, counted once',
    paragraphs: [
      'The device limit applies to unique registered devices, not simultaneous connections. Using two VPN applications on the same device counts as one device.',
      'Each additional device costs $0.02 per day. You can add up to 10 extra devices on any plan: up to 13 in total on Orbis, 15 on Sidus, or 20 on Aether.',
      'For example, Sidus with two extra devices gives you seven registered devices for $0.25 per day: $0.21 for the plan plus $0.04 for the extra devices.',
    ],
  },
  {
    id: 'switching',
    title: 'Changing your plan',
    paragraphs: [
      'You can manually switch plans in your account dashboard. The price changes to the new plan’s rate immediately.',
    ],
  },
  {
    id: 'network',
    title: 'Traffic, speed & routing',
    paragraphs: [
      'All plans include unlimited traffic. Orbis supports speeds up to 100 Mbps and Sidus up to 300 Mbps. Aether has no plan-level speed cap. Actual connection speed depends on your network and connection conditions.',
      'Sidus and Aether include two-hop extended access. Your VPN first connects to a server on an allowlisted IP address, which then connects to a regular VPN server. This cascade is designed to help with allowlist-based restrictions, such as those used in Russia.',
      'Aether also includes gaming-optimized routes.',
    ],
  },
  {
    id: 'payments',
    title: 'Payments & refunds',
    paragraphs: [
      'You can top up your balance by card or cryptocurrency. Automatic top-ups are optional.',
      'Balance top-ups are non-refundable. Unused account balance cannot be refunded.',
    ],
  },
]

const linkStyle =
  'inline-flex items-center gap-2 rounded-sm text-sm text-fg-muted transition-colors hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-fg'

export function PricingTermsPage() {
  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Plan terms — Spatium'
    window.scrollTo(0, 0)
    return () => {
      document.title = previousTitle
    }
  }, [])

  return (
    <>
      <Header />
      <main className="landing-container pt-28 pb-16 sm:pt-36 sm:pb-24">
        <div>
          <a href="/#pricing" className={linkStyle}>
            <ArrowLeft size={15} aria-hidden /> Back to plans
          </a>
          <div className="mt-8">
            <h1 className="text-3xl font-medium tracking-tight">Plan terms</h1>
            <p className="mt-3 text-base leading-7 text-fg-muted">
              Billing, device limits, plan changes, and payments.
            </p>
          </div>

          <div className="mt-10 grid gap-10 border-t border-white/10 pt-10 lg:grid-cols-[200px_1fr] lg:gap-16">
            <nav aria-label="Plan terms sections" className="lg:sticky lg:top-24 lg:self-start">
              <p className="mb-5 text-xs font-medium tracking-[0.14em] text-fg-muted uppercase">
                On this page
              </p>
              <ol className="space-y-4">
                {sections.map((section, index) => (
                  <li key={section.id}>
                    <a href={`#${section.id}`} className={`${linkStyle} items-baseline! leading-5`}>
                      <span className="font-mono text-xs text-white/40">0{index + 1}</span>
                      {section.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
            <div>
              {sections.map((section, index) => (
                <section
                  key={section.id}
                  id={section.id}
                  aria-labelledby={`${section.id}-title`}
                  className="scroll-mt-24 border-b border-white/10 pb-10 not-first:pt-10 sm:pb-12 sm:not-first:pt-12"
                >
                  <p className="mb-3 font-mono text-xs text-fg-muted">0{index + 1}</p>
                  <h2
                    id={`${section.id}-title`}
                    className="text-2xl font-medium tracking-tight sm:text-[28px]"
                  >
                    {section.title}
                  </h2>
                  <div className="mt-5 space-y-4 text-base leading-7 font-light text-white/70">
                    {section.paragraphs.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                </section>
              ))}
              <Link to="/dashboard/subscription" className={`${linkStyle} mt-8`}>
                Manage your plan <ArrowUpRight size={15} aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
