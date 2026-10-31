import { Link } from 'react-router'
import { SUPPORT_EMAIL, SUPPORT_TELEGRAM } from '../landing/footer/links'
import { LegalDocument, legalLinkStyle, type LegalSection } from './LegalDocument'

const sections: LegalSection[] = [
  {
    id: 'service',
    title: 'The service',
    paragraphs: [
      'Spatium provides encrypted VPN access through its own apps and compatible third-party clients. Plans are paid daily from a prepaid balance; prices, limits, and billing rules are described in the Plan terms.',
      'By creating an account or using the service, you agree to these terms.',
    ],
  },
  {
    id: 'account',
    title: 'Your account',
    paragraphs: [
      'You are responsible for keeping your login and subscription link private. Anyone with your subscription link can connect devices to your plan, so treat it like a password and regenerate it in the dashboard if it leaks.',
      'An account is for one person and their own devices. Reselling or publicly sharing access is not allowed.',
    ],
  },
  {
    id: 'use',
    title: 'Acceptable use',
    paragraphs: [
      'Do not use Spatium for activity that is illegal where you are, to send spam, to attack or scan other networks, to distribute malware, or in a way that degrades the service for other people.',
      'Because we keep no activity logs, we cannot monitor individual traffic. We act on abuse when it is reported to us with evidence that points to a specific account.',
    ],
  },
  {
    id: 'billing',
    title: 'Billing',
    paragraphs: [
      'Your plan is charged once a day from your balance. When the balance runs out, the connection stops until you top up. Top-ups are non-refundable; full details are in the Plan terms.',
    ],
  },
  {
    id: 'availability',
    title: 'Availability',
    paragraphs: [
      'We work to keep servers fast and reachable, including on networks that filter VPN traffic, but we cannot guarantee that every network or region will allow a connection at all times. Speeds depend on your network and connection conditions.',
      'Servers may be briefly unavailable during maintenance. Planned work is announced in the dashboard.',
    ],
  },
  {
    id: 'suspension',
    title: 'Suspension',
    paragraphs: [
      'We may suspend an account that breaks these terms. Before doing so we will contact you through the email on the account, unless the abuse is ongoing and harms other users.',
    ],
  },
  {
    id: 'liability',
    title: 'Liability',
    paragraphs: [
      'Spatium is provided as is. To the extent the law allows, we are not liable for indirect losses caused by interruptions of the service. Our total liability is limited to the amount you paid in the 30 days before the claim.',
    ],
  },
  {
    id: 'changes',
    title: 'Changes & contact',
    paragraphs: [
      'If these terms change, we will announce it in the dashboard at least 14 days before the new version applies.',
      `Questions go to ${SUPPORT_EMAIL} or ${SUPPORT_TELEGRAM.handle} on Telegram.`,
    ],
  },
]

export function TermsPage() {
  return (
    <LegalDocument
      title="Terms of service"
      lead="The rules for using Spatium, and what you can expect from us."
      documentTitle="Terms of service — Spatium"
      updated="October 31, 2026"
      back={{ href: '/', label: 'Back to Spatium' }}
      sections={sections}
    >
      <Link to="/pricing/terms" className={`${legalLinkStyle} mt-8`}>
        Read the Plan terms
      </Link>
    </LegalDocument>
  )
}
