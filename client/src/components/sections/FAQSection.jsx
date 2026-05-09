import { useRef, useState } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { ChevronDown, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

function FAQItem({ item, index }) {
  const [open, setOpen] = useState(false)

  return (
    <div
      className={`border rounded-xl overflow-hidden transition-all duration-300 ${
        open ? 'border-gold/40 shadow-gold-glow' : 'border-white/8 hover:border-white/15'
      }`}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-4 p-5 text-left bg-bg-secondary hover:bg-bg-secondary/80 transition-colors"
        aria-expanded={open}
      >
        <span className={`font-medium text-sm md:text-base ${open ? 'text-white' : 'text-cream'}`}>
          {item.q}
        </span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className={`flex-shrink-0 ${open ? 'text-gold' : 'text-muted'}`}
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: 'easeInOut' }}
          >
            <div className="px-5 pb-5 pt-1 bg-bg-secondary/50">
              <p className="text-muted text-sm leading-relaxed">{item.a}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function FAQSection() {
  const { t } = useTranslation('landing')
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const faqs = t('faq.items', { returnObjects: true })

  return (
    <section className="py-24" ref={ref}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="text-gold text-sm font-medium uppercase tracking-widest">{t('faq.badge')}</span>
          <h2 className="section-title mt-3">
            {t('faq.title')} <span className="gold-text">{t('faq.titleHighlight')}</span>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="space-y-3"
        >
          {Array.isArray(faqs) && faqs.map((item, i) => (
            <FAQItem key={i} item={item} index={i} />
          ))}
        </motion.div>

        {/* Final CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5 }}
          className="mt-16 text-center"
        >
          <div className="card p-10 border border-gold/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-gold/5 to-transparent pointer-events-none" />
            <div className="relative">
              <div className="text-5xl mb-4">📖</div>
              <h3 className="text-3xl font-heading font-bold text-white mb-3">
                {t('faq.readyTitle')}
              </h3>
              <p className="text-muted mb-8 max-w-md mx-auto">{t('faq.readyDesc')}</p>
              <Link
                to="/register"
                className="btn-primary inline-flex items-center gap-2 px-10 py-4 text-base animate-pulse-gold"
              >
                {t('faq.readyCta')}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-muted text-xs mt-4">{t('faq.readyFooter')}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
