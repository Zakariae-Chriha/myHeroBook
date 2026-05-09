import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import { Check, Zap } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { BOOK_TIERS } from '../../utils/constants.js'

const TIER_STYLES = [
  { color: 'border-white/10', headerBg: 'bg-bg-primary', badge: false, key: 'digital' },
  { color: 'border-gold',     headerBg: 'bg-gold-gradient', badge: true, key: 'printed' },
  { color: 'border-white/10', headerBg: 'bg-bg-primary', badge: false, key: 'voice' },
]

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.14 } },
}
const cardVariants = {
  hidden: { opacity: 0, y: 36 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

export default function PricingSection() {
  const { t } = useTranslation('landing')
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  const tiers = TIER_STYLES.map((style) => ({
    ...BOOK_TIERS[style.key],
    ...style,
    cta: t(`pricing.tiers.${style.key}.cta`),
    badgeLabel: style.badge ? t('pricing.popular') : null,
  }))

  return (
    <section id="pricing" className="py-24 relative" ref={ref}>
      {/* Background accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-bg-primary via-bg-secondary/20 to-bg-primary pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-gold text-sm font-medium uppercase tracking-widest">{t('pricing.badge')}</span>
          <h2 className="section-title mt-3">
            {t('pricing.title')} <span className="gold-text">{t('pricing.titleHighlight')}</span>
          </h2>
          <p className="section-subtitle">{t('pricing.subtitle')}</p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch"
        >
          {tiers.map((tier) => (
            <motion.div key={tier.id} variants={cardVariants} className="relative">
              {/* Popular glow */}
              {tier.popular && (
                <div className="absolute -inset-px rounded-2xl bg-gold-gradient opacity-30 blur-sm" />
              )}

              <div className={`relative card border-2 ${tier.color} h-full flex flex-col overflow-hidden ${tier.popular ? 'shadow-gold-glow-lg' : ''}`}>
                {/* Popular badge */}
                {tier.badgeLabel && (
                  <div className="absolute top-0 left-0 right-0 bg-gold-gradient text-bg-primary text-xs font-bold text-center py-1.5 tracking-wide">
                    {tier.badgeLabel}
                  </div>
                )}

                {/* Header */}
                <div className={`p-6 ${tier.popular ? 'pt-10' : 'pt-6'}`}>
                  <p className="text-muted text-sm font-medium mb-1">{tier.label}</p>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-5xl font-heading font-bold text-white">{tier.priceDisplay}</span>
                  </div>
                  <p className={`text-sm italic ${tier.popular ? 'text-gold' : 'text-muted'}`}>
                    "{tier.tagline}"
                  </p>
                </div>

                {/* Divider */}
                <div className="h-px bg-white/5 mx-6" />

                {/* Features */}
                <div className="p-6 flex-1">
                  <ul className="space-y-3">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${tier.popular ? 'bg-gold-gradient' : 'bg-white/10'}`}>
                          <Check className={`w-3 h-3 ${tier.popular ? 'text-bg-primary' : 'text-cream'}`} />
                        </div>
                        <span className="text-cream text-sm leading-relaxed">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA */}
                <div className="p-6 pt-0">
                  <Link
                    to="/register"
                    className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all duration-300 ${
                      tier.popular
                        ? 'bg-gold-gradient text-bg-primary hover:shadow-gold-glow hover:scale-[1.02]'
                        : 'border border-gold/30 text-gold hover:bg-gold/10'
                    }`}
                  >
                    {tier.id === 'voice' && <span>🎙️</span>}
                    {tier.cta}
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Addons row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.7 }}
          className="mt-12 text-center"
        >
          <p className="text-muted text-sm mb-4">{t('pricing.addons')}</p>
          <div className="flex flex-wrap gap-3 justify-center">
            {[
              { label: 'Rush Printing (2–3 days)', price: '+€9.99' },
              { label: 'Extra Copy', price: '+€19.99' },
              { label: 'Gift Wrapping', price: '+€4.99' },
              { label: 'Voice Add-on to Existing Order', price: '+€14.99' },
            ].map((addon) => (
              <div key={addon.label} className="bg-bg-secondary border border-white/10 rounded-full px-4 py-2 text-sm">
                <span className="text-cream">{addon.label}</span>
                <span className="text-gold ml-2 font-medium">{addon.price}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Subscription note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.9 }}
          className="mt-8 text-center"
        >
          <div className="inline-flex items-center gap-2 bg-bg-secondary border border-white/10 rounded-full px-5 py-2.5">
            <Zap className="w-4 h-4 text-gold" />
            <span className="text-sm text-cream">
              <strong className="text-gold">{t('pricing.monthlyPlan')}:</strong> €7.99/mo · 2 digital books ·{' '}
              <strong className="text-gold">{t('pricing.yearlyPlan')}:</strong> €59.99/yr · Unlimited digital books
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
