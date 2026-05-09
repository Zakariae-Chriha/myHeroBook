import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Upload, Wand2, BookOpen, Package } from 'lucide-react'

const STEP_ICONS = [Upload, Wand2, BookOpen, Package]
const STEP_EMOJIS = ['📸', '✨', '🤖', '🎁']
const STEP_COLORS = [
  { color: 'from-blue-500/20 to-blue-600/5', border: 'border-blue-500/30' },
  { color: 'from-purple-500/20 to-purple-600/5', border: 'border-purple-500/30' },
  { color: 'from-gold/20 to-gold/5', border: 'border-gold/30' },
  { color: 'from-green-500/20 to-green-600/5', border: 'border-green-500/30' },
]

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.18 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

export default function HowItWorksSection() {
  const { t } = useTranslation('landing')
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  const steps = [1, 2, 3, 4].map((n, i) => ({
    step: String(n).padStart(2, '0'),
    icon: STEP_ICONS[i],
    emoji: STEP_EMOJIS[i],
    title: t(`howItWorks.steps.${n}.title`),
    description: t(`howItWorks.steps.${n}.description`),
    ...STEP_COLORS[i],
  }))

  return (
    <section id="how-it-works" className="py-24 relative" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-gold text-sm font-medium uppercase tracking-widest">{t('howItWorks.badge')}</span>
          <h2 className="section-title mt-3">
            {t('howItWorks.title')}{' '}
            <span className="gold-text">{t('howItWorks.titleSub')}</span>
          </h2>
          <p className="section-subtitle">{t('howItWorks.subtitle')}</p>
        </motion.div>

        {/* Steps grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative"
        >
          {/* Connecting line — desktop only */}
          <div className="hidden lg:block absolute top-16 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent z-0" />

          {steps.map((step) => (
            <motion.div key={step.step} variants={cardVariants} className="relative z-10">
              <div className={`card p-6 h-full bg-gradient-to-b ${step.color} border ${step.border} group hover:shadow-gold-glow transition-all duration-300 hover:-translate-y-1`}>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-xl bg-bg-primary border border-white/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    {step.emoji}
                  </div>
                  <span className="text-4xl font-heading font-bold text-white/8 select-none">{step.step}</span>
                </div>
                <h3 className="text-white font-semibold text-lg mb-3 font-heading">{step.title}</h3>
                <p className="text-muted text-sm leading-relaxed">{step.description}</p>
              </div>

              {step.step !== '04' && (
                <div className="flex justify-center py-2 lg:hidden text-gold/40 text-xl">↓</div>
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="text-center mt-14"
        >
          <a href="/register" className="btn-primary inline-flex items-center gap-2 px-8 py-4 text-base">
            {t('howItWorks.cta')}
          </a>
          <p className="text-muted text-sm mt-3">{t('howItWorks.ctaSub')}</p>
        </motion.div>
      </div>
    </section>
  )
}
