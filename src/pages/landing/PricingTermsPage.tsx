import { Link } from 'react-router'
import { ArrowUpRight } from 'lucide-react'
import { LegalDocument, legalLinkStyle, type LegalSection } from '../legal/LegalDocument'

const sections: LegalSection[] = [
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

export function PricingTermsPage() {
  return (
    <LegalDocument
      title="Plan terms"
      lead="Billing, device limits, plan changes, and payments."
      documentTitle="Plan terms — Spatium"
      back={{ href: '/#pricing', label: 'Back to plans' }}
      sections={sections}
    >
      <Link to="/dashboard/subscription" className={`${legalLinkStyle} mt-8`}>
        Manage your plan <ArrowUpRight size={15} aria-hidden />
      </Link>
    </LegalDocument>
  )
}
