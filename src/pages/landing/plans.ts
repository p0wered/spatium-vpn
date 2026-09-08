type Feature = {
  included: boolean
  label: string
}

export type Plan = {
  name: string
  tagline: string
  price: string
  featured: boolean
  features: Feature[]
}

export const plans: Plan[] = [
  {
    name: 'Orbis',
    tagline: 'Everyday essentials',
    price: '0.12$',
    featured: false,
    features: [
      { included: true, label: '3 devices included' },
      { included: true, label: 'Unlimited traffic' },
      { included: true, label: 'Up to 100 Mbps' },
      { included: false, label: 'Two hop extended access' },
      { included: false, label: 'Gaming-optimized routes' },
    ],
  },
  {
    name: 'Sidus',
    tagline: 'A wider orbit',
    price: '0.21$',
    featured: true,
    features: [
      { included: true, label: '5 devices included' },
      { included: true, label: 'Unlimited traffic' },
      { included: true, label: 'Up to 300 Mbps' },
      { included: true, label: 'Two hop extended access' },
      { included: false, label: 'Gaming-optimized routes' },
    ],
  },
  {
    name: 'Aether',
    tagline: 'The open sky',
    price: '0.33$',
    featured: false,
    features: [
      { included: true, label: '10 devices included' },
      { included: true, label: 'Unlimited traffic' },
      { included: true, label: 'Unlimited speed' },
      { included: true, label: 'Two hop extended access' },
      { included: true, label: 'Gaming-optimized routes' },
    ],
  },
]
