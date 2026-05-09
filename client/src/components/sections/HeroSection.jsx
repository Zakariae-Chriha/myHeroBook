import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Star, Sparkles, ArrowRight, ChevronDown } from 'lucide-react'

// Floating gold particles
const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 4 + 2,
  delay: Math.random() * 5,
  duration: Math.random() * 4 + 4,
}))

function FloatingBook() {
  return (
    <motion.div
      animate={{ y: [0, -18, 0] }}
      transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
      className="relative w-64 h-80 md:w-80 md:h-96 mx-auto"
    >
      {/* Book glow */}
      <div className="absolute inset-0 rounded-2xl bg-gold/20 blur-3xl scale-110" />

      {/* Book spine shadow */}
      <div className="absolute left-0 top-2 bottom-2 w-4 bg-gradient-to-r from-black/60 to-transparent rounded-l-xl z-10" />

      {/* Book cover */}
      <div className="relative w-full h-full rounded-2xl overflow-hidden border-2 border-gold/40 shadow-gold-glow-lg bg-gradient-to-br from-bg-secondary via-[#162040] to-bg-primary">

        {/* Stars pattern background */}
        <div className="absolute inset-0 overflow-hidden opacity-30">
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-gold rounded-full"
              style={{ left: `${(i * 37 + 10) % 90}%`, top: `${(i * 53 + 5) % 85}%` }}
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.5, 1.2, 0.5] }}
              transition={{ duration: 2 + i * 0.3, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>

        {/* Gold top bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gold-gradient" />

        {/* Book title area */}
        <div className="absolute top-8 left-0 right-0 px-6 text-center">
          <p className="text-gold text-xs font-body uppercase tracking-[0.2em] mb-1">Hero Kids StoryLab</p>
          <h3 className="font-accent text-cream text-xl leading-tight">Emma and the Astronaut Adventure!</h3>
        </div>

        {/* Illustrated child silhouette */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <motion.div
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="relative"
          >
            {/* Hero circle backdrop */}
            <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-gold/30 to-gold/10 flex items-center justify-center text-5xl">
                🚀
              </div>
            </div>
            {/* Gold ring */}
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-gold/50"
              animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
        </div>

        {/* Bottom name badge */}
        <div className="absolute bottom-8 left-0 right-0 px-6 text-center">
          <div className="inline-block bg-gold/20 border border-gold/40 rounded-full px-4 py-1.5">
            <span className="font-accent text-gold text-lg">Emma</span>
            <span className="text-cream text-xs ml-1.5">is the hero</span>
          </div>
        </div>

        {/* Gold bottom bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gold-gradient" />
      </div>

      {/* Page edges effect */}
      <div className="absolute right-0 top-2 bottom-2 w-3 flex flex-col justify-center gap-px opacity-60">
        {Array.from({ length: 18 }).map((_, i) => (
          <div key={i} className="h-px bg-gradient-to-r from-cream/20 to-cream/5 flex-1" />
        ))}
      </div>

      {/* Floating sparkles around book */}
      {[
        { top: '-8%', left: '10%', delay: 0 },
        { top: '15%', right: '-10%', delay: 0.8 },
        { bottom: '20%', left: '-8%', delay: 1.4 },
        { bottom: '-5%', right: '15%', delay: 0.4 },
      ].map((pos, i) => (
        <motion.div
          key={i}
          className="absolute text-gold"
          style={pos}
          animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5], rotate: [0, 180] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: pos.delay }}
        >
          <Sparkles className="w-5 h-5" />
        </motion.div>
      ))}
    </motion.div>
  )
}

export default function HeroSection() {
  const { t } = useTranslation('landing')
  return (
    <section className="relative min-h-screen flex flex-col justify-center pt-16 overflow-hidden">
      {/* Deep background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#060912] via-bg-primary to-[#0d1628]" />

      {/* Radial glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Floating particles */}
      {PARTICLES.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-gold/40 pointer-events-none"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
          animate={{ y: [0, -30, 0], opacity: [0.2, 0.8, 0.2] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center min-h-[calc(100vh-4rem)] py-16">

          {/* Left — copy */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-center lg:text-left"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-gold/10 border border-gold/30 rounded-full px-4 py-2 mb-6"
            >
              <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
              <span className="text-gold text-sm font-medium">{t('hero.badge')}</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.7 }}
              className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold leading-[1.08] text-white mb-6"
            >
              {t('hero.titlePre')}{' '}
              <span className="relative inline-block">
                <span className="gold-text">{t('hero.titleHighlight')}</span>
                <motion.span
                  className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gold-gradient rounded-full"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.9, duration: 0.6 }}
                />
              </span>{' '}
              {t('hero.titlePost')}
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="text-xl md:text-2xl text-muted mb-4 leading-relaxed"
            >
              {t('hero.subtitle')}
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55 }}
              className="text-muted text-base mb-10 max-w-lg mx-auto lg:mx-0 leading-relaxed"
            >
              {t('hero.ctaSub')}
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-10"
            >
              <Link
                to="/register"
                className="btn-primary flex items-center justify-center gap-2 text-base px-8 py-4 animate-pulse-gold"
              >
                {t('hero.cta')}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#how-it-works"
                className="btn-secondary flex items-center justify-center gap-2 text-base px-8 py-4"
              >
                {t('howItWorks.title')}
              </a>
            </motion.div>

            {/* Social proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex items-center gap-5 justify-center lg:justify-start"
            >
              <div className="flex -space-x-2">
                {['🧒', '👧', '🧒‍♀️', '👦', '🧒'].map((emoji, i) => (
                  <div key={i} className="w-9 h-9 rounded-full bg-bg-secondary border-2 border-bg-primary flex items-center justify-center text-base shadow-md">
                    {emoji}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-gold text-gold" />)}
                  <span className="text-gold font-semibold text-sm ml-1">4.9</span>
                </div>
                <p className="text-muted text-xs">{t('hero.socialProof')}</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Right — animated book */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
            className="flex justify-center lg:justify-end"
          >
            <FloatingBook />
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.a
        href="#how-it-works"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-muted hover:text-gold transition-colors"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 1.8, repeat: Infinity }}
      >
        <ChevronDown className="w-6 h-6" />
      </motion.a>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-bg-primary to-transparent pointer-events-none" />
    </section>
  )
}
