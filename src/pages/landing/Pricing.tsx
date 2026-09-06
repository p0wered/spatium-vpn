import { useRef } from 'react'
import { motion, useInView, useReducedMotion, type Variants } from 'motion/react'
import { Check } from 'lucide-react'
import { Button } from '../../components/Button'

type Feature = {
  included: boolean
  label: string
}

type Plan = {
  name: string
  tagline: string
  price: string
  featured: boolean
  features: Feature[]
}

const plans: Plan[] = [
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

const revealContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.06 } },
}

const textItem: Variants = {
  hidden: { opacity: 0, y: 28, filter: 'blur(6px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
  },
}

/** Featured plan leads; the sides follow it. */
function cardDelay(name: Plan['name']) {
  if (name === 'Sidus') return 0.12
  if (name === 'Orbis') return 0.22
  return 0.3
}

function DashMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
      <rect x="3" y="7.35" width="10" height="1.3" rx="0.65" fill="currentColor" />
    </svg>
  )
}

function PlanCard({
  plan,
  visible,
  reduced,
}: {
  plan: Plan
  visible: boolean
  reduced: boolean | null
}) {
  return (
    <motion.article
      className="pricing-card flex h-full flex-col"
      aria-labelledby={`plan-${plan.name.toLowerCase()}`}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 28, filter: 'blur(8px)' }}
      animate={
        visible
          ? { opacity: 1, y: 0, filter: 'blur(0px)' }
          : reduced
            ? { opacity: 0 }
            : { opacity: 0, y: 28, filter: 'blur(8px)' }
      }
      transition={{
        duration: reduced ? 0.4 : 0.85,
        delay: visible ? cardDelay(plan.name) : 0,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <div className="pricing-card-body">
        <h3 id={`plan-${plan.name.toLowerCase()}`} className="pricing-card-name">
          {plan.name}
        </h3>
        <p className="pricing-card-tagline">{plan.tagline}</p>

        <p className="pricing-card-price">
          <span>{plan.price}</span>
          <span>/day</span>
        </p>

        <ul className="pricing-card-features">
          {plan.features.map((feature) => (
            <li
              key={feature.label}
              className={feature.included ? 'is-included' : 'is-excluded'}
            >
              {feature.included ? (
                <Check size={16} strokeWidth={1.75} aria-hidden />
              ) : (
                <DashMark />
              )}
              <span>
                {feature.label}
                {!feature.included && <span className="sr-only"> (not included)</span>}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <Button
        type="button"
        size="lg"
        variant={plan.featured ? 'primary' : 'secondary'}
        className={`pricing-card-cta rounded-full! ${plan.featured ? '' : 'bg-white/10!'}`}
      >
        Get {plan.name}
      </Button>
    </motion.article>
  )
}

/**
 * Closing conversion on the landing. Composition follows the approved
 * three-plan board; material stays in the page's glass language.
 */
export function Pricing() {
  const sectionRef = useRef<HTMLElement>(null)
  const inView = useInView(sectionRef, { once: true, amount: 0.18 })
  const reduced = useReducedMotion()

  return (
    <section
      id="pricing"
      ref={sectionRef}
      aria-labelledby="pricing-title"
      className="relative scroll-mt-24 overflow-hidden bg-black py-24 sm:py-28 lg:py-[132px]"
    >
      <motion.div
        className="mx-auto w-full max-w-[1240px] px-5 sm:px-6"
        variants={revealContainer}
        initial={reduced ? false : 'hidden'}
        animate={reduced || inView ? 'show' : 'hidden'}
      >
        <motion.h2
          id="pricing-title"
          variants={textItem}
          className="mx-auto max-w-[720px] bg-[linear-gradient(180deg,#fff_8%,rgb(255_255_255/0.72)_100%)] bg-clip-text text-center text-4xl leading-[1.06] font-semibold tracking-[-0.03em] text-transparent text-balance sm:text-5xl lg:text-[64px] lg:leading-[68px]"
        >
          Your pace, your plan
        </motion.h2>

        <motion.p
          variants={textItem}
          className="mx-auto mt-3.5 max-w-[520px] text-center text-base leading-6 font-light text-white/75 sm:text-lg sm:leading-7"
        >
          Billed daily from your balance. Stay connected for as long as it lasts.
        </motion.p>

        <div className="mt-14 grid gap-4 sm:mt-16 sm:gap-5 lg:mt-[72px] lg:grid-cols-3 lg:items-stretch lg:gap-6">
          {plans.map((plan) => (
            <PlanCard
              key={plan.name}
              plan={plan}
              visible={Boolean(reduced || inView)}
              reduced={reduced}
            />
          ))}
        </div>
      </motion.div>
    </section>
  )
}
