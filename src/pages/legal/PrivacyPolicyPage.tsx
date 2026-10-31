import { SUPPORT_EMAIL, SUPPORT_TELEGRAM } from '../landing/footer/links'
import { LegalDocument, type LegalSection } from './LegalDocument'

const sections: LegalSection[] = [
  {
    id: 'collect',
    title: 'What we collect',
    paragraphs: [
      'To run your account we keep the email address and nickname you sign up with, your balance and payment history, and the list of devices you register: a name you choose and the platform it runs on.',
      'That is the complete list. We do not ask for your real name, phone number, or address, and the service works the same without them.',
    ],
  },
  {
    id: 'no-logs',
    title: 'What we never log',
    paragraphs: [
      'Spatium does not record the websites you visit, the destination of your traffic, your DNS queries, the IP address you connect from, or when your sessions start and end.',
      'Traffic passes through our servers and is forgotten as soon as it is forwarded. There is no activity history to store, analyse, or hand over.',
    ],
  },
  {
    id: 'connection',
    title: 'Connection data',
    paragraphs: [
      'To balance load we measure total bandwidth per server, never per person. To enforce your plan’s device limit we count active devices in memory; the count is discarded when the connection closes.',
    ],
  },
  {
    id: 'dns',
    title: 'DNS inside the tunnel',
    paragraphs: [
      'While connected, every DNS request is resolved by Spatium resolvers inside the encrypted tunnel, so your network provider cannot see which domains you look up. Our resolvers do not keep query logs.',
    ],
  },
  {
    id: 'payments',
    title: 'Payments',
    paragraphs: [
      'Card payments are handled by our payment provider. We receive only the payment status and the last four digits of the card, which you can see in your billing history.',
      'For cryptocurrency top-ups we store the transaction hash so we can credit your balance and help if something goes wrong.',
    ],
  },
  {
    id: 'sharing',
    title: 'Sharing',
    paragraphs: [
      'We do not sell, rent, or trade personal data, and we do not use advertising or third-party trackers on this site or in the apps.',
      'If we receive a lawful request, we can only provide what is listed in “What we collect”. Information we never store cannot be disclosed.',
    ],
  },
  {
    id: 'deletion',
    title: 'Retention & deletion',
    paragraphs: [
      'Your account data is kept while the account exists. To delete your account, write to support from the email on the account; its data is erased within 30 days, except payment records we are legally required to keep.',
    ],
  },
  {
    id: 'contact',
    title: 'Contact',
    paragraphs: [
      `Questions about privacy go to ${SUPPORT_EMAIL} or ${SUPPORT_TELEGRAM.handle} on Telegram. If this policy changes, we will announce it in the dashboard before the new version takes effect.`,
    ],
  },
]

export function PrivacyPolicyPage() {
  return (
    <LegalDocument
      title="Privacy policy"
      lead="What Spatium stores, what it never logs, and how to remove your data."
      documentTitle="Privacy policy — Spatium"
      updated="October 31, 2026"
      back={{ href: '/', label: 'Back to Spatium' }}
      sections={sections}
    />
  )
}
