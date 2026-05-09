import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ArrowLeft, BookOpen, Gift } from 'lucide-react'
import { useBook } from '../../context/BookContext.jsx'
import { useTranslation } from 'react-i18next'
import { STORY_THEMES } from '../../utils/constants.js'

const EPISODE_OPTIONS = [
  { number: 1, label: 'Episode 1', desc: 'The beginning of the Hero Universe' },
  { number: 2, label: 'Episode 2', desc: 'The adventure continues…' },
  { number: 3, label: 'Episode 3', desc: 'The saga deepens' },
  { number: 4, label: 'Episode 4+', desc: 'An ongoing legend' },
]

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
}
const itemVariants = {
  hidden: { opacity: 0, scale: 0.93 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.25 } },
}

export default function Step4_Personalize({ onBack }) {
  const { wizard, setField, nextStep } = useBook()
  const { t } = useTranslation('wizard')

  const [theme, setTheme] = useState(wizard.storyTheme || 'save-the-world')
  const [episode, setEpisode] = useState(wizard.episodeNumber || 1)
  const [dedication, setDedication] = useState(wizard.dedication || '')
  const [isGift, setIsGift] = useState(wizard.isGift || false)
  const [giftRecipient, setGiftRecipient] = useState(wizard.giftRecipient || '')

  const selectedTheme = STORY_THEMES.find((t) => t.id === theme)
  const title = `${wizard.childName || 'Your child'} and the ${wizard.chosenJob || 'Adventure'} Adventure!`

  const handleNext = () => {
    setField('storyTheme', theme)
    setField('episodeNumber', episode)
    setField('dedication', dedication.trim())
    setField('isGift', isGift)
    setField('giftRecipient', isGift ? giftRecipient.trim() : '')
    nextStep()
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-3xl font-heading font-bold text-white mb-2">
            {t('step4.title')} <span className="gold-text">{t('step4.titleHighlight')}</span>
          </h2>
          <p className="text-muted">{t('step4.subtitle')}</p>
        </motion.div>
      </div>

      <div className="space-y-8">
        {/* Animated book title preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative card p-6 border border-gold/25 overflow-hidden"
        >
          {/* Glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-gold/8 to-transparent pointer-events-none" />
          <div className="relative flex items-center gap-5">
            {/* Mini book cover */}
            <div className="w-20 h-24 rounded-lg bg-gradient-to-br from-bg-secondary to-bg-primary border-2 border-gold/40 flex flex-col items-center justify-center shadow-gold-glow flex-shrink-0">
              <span className="text-2xl mb-1">
                {STORY_THEMES.find(t => t.id === theme)?.emoji || '🌟'}
              </span>
              <div className="w-8 h-0.5 bg-gold/40 rounded mb-0.5" />
              <div className="w-6 h-0.5 bg-gold/25 rounded" />
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-gradient rounded-b-lg" />
            </div>
            <div>
              <p className="text-muted text-xs mb-1">Episode {episode} · {selectedTheme?.label || 'Adventure'}</p>
              <h3 className="font-accent text-gold text-xl leading-snug">{title}</h3>
              {wizard.childName && (
                <p className="text-muted text-xs mt-1.5">
                  Starring <span className="text-cream">{wizard.childName}</span>
                  {wizard.bestFriendName && ` & ${wizard.bestFriendName}`}
                  {wizard.petName && ` with ${wizard.petName}`}
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Story theme */}
        <div>
          <label className="label text-base">Choose a story theme</label>
          <p className="text-muted text-sm mb-4">Sets the backdrop and mood of the entire adventure.</p>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 sm:grid-cols-3 gap-3"
          >
            {STORY_THEMES.map((t) => (
              <motion.button
                key={t.id}
                type="button"
                variants={itemVariants}
                onClick={() => setTheme(t.id)}
                whileTap={{ scale: 0.97 }}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer text-center ${
                  theme === t.id
                    ? 'border-gold bg-gold/10 shadow-gold-glow'
                    : 'border-white/10 hover:border-white/25 bg-bg-secondary'
                }`}
              >
                <span className="text-3xl">{t.emoji}</span>
                <div>
                  <p className={`text-sm font-semibold ${theme === t.id ? 'text-gold' : 'text-white'}`}>
                    {t.label}
                  </p>
                  <p className="text-muted text-xs">{t.description}</p>
                </div>
                {theme === t.id && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 right-2 w-4 h-4 rounded-full bg-gold flex items-center justify-center"
                  >
                    <span className="text-bg-primary text-xs">✓</span>
                  </motion.div>
                )}
              </motion.button>
            ))}
          </motion.div>
        </div>

        {/* Episode number */}
        <div>
          <label className="label text-base">Which episode is this?</label>
          <p className="text-muted text-sm mb-4">
            Every book is part of your child's Hero Universe. Return every birthday for the next chapter.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {EPISODE_OPTIONS.map((ep) => (
              <button
                key={ep.number}
                type="button"
                onClick={() => setEpisode(ep.number)}
                className={`flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer text-center ${
                  episode === ep.number
                    ? 'border-gold bg-gold/10 shadow-gold-glow'
                    : 'border-white/10 hover:border-white/25 bg-bg-secondary'
                }`}
              >
                <span className={`text-2xl font-heading font-bold ${episode === ep.number ? 'text-gold' : 'text-white'}`}>
                  {ep.number === 4 ? '4+' : ep.number}
                </span>
                <p className={`text-xs font-medium ${episode === ep.number ? 'text-gold' : 'text-cream'}`}>
                  {ep.label}
                </p>
                <p className="text-muted text-xs">{ep.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Dedication */}
        <div>
          <label className="label text-base">
            Personal dedication{' '}
            <span className="text-muted text-sm font-normal">(optional)</span>
          </label>
          <p className="text-muted text-sm mb-3">
            Printed on the inside cover. A message they'll read every time they open the book.
          </p>
          <div className="relative">
            <textarea
              value={dedication}
              onChange={(e) => setDedication(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder={`e.g. "To Emma — may you always believe you can save the world. All my love, Mum 💛"`}
              className="input-field resize-none"
            />
            <span className="absolute bottom-3 right-3 text-muted text-xs">
              {dedication.length}/500
            </span>
          </div>

          <AnimatePresence>
            {dedication.trim() && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-3 bg-bg-secondary border border-white/5 rounded-xl p-4"
              >
                <p className="text-muted text-xs mb-1 flex items-center gap-1.5">
                  <BookOpen className="w-3 h-3" /> Dedication preview
                </p>
                <p className="font-accent text-cream text-base italic leading-relaxed">
                  "{dedication.trim()}"
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Gift mode */}
        <div>
          <label className="label text-base">Is this book a gift?</label>
          <p className="text-muted text-sm mb-4">
            The cover will say "A gift for [name]" — perfect for birthdays and holidays.
          </p>

          <button
            type="button"
            onClick={() => setIsGift((v) => !v)}
            className={`flex items-center gap-3 w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${
              isGift
                ? 'border-gold bg-gold/10 shadow-gold-glow'
                : 'border-white/10 hover:border-white/25 bg-bg-secondary'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isGift ? 'bg-gold text-bg-primary' : 'bg-white/10 text-muted'}`}>
              <Gift className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className={`font-semibold text-sm ${isGift ? 'text-gold' : 'text-white'}`}>
                {isGift ? 'Yes, this is a gift!' : 'Yes, this book is a gift'}
              </p>
              <p className="text-muted text-xs">{isGift ? 'Cover will show the gift recipient' : 'Tap to enable'}</p>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isGift ? 'border-gold bg-gold' : 'border-white/20'}`}>
              {isGift && <span className="text-bg-primary text-xs font-bold">✓</span>}
            </div>
          </button>

          <AnimatePresence>
            {isGift && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-3">
                  <input
                    type="text"
                    value={giftRecipient}
                    onChange={(e) => setGiftRecipient(e.target.value)}
                    placeholder={`e.g. "Emma" or "Grandma's little hero"`}
                    maxLength={100}
                    className="input-field"
                  />
                  <p className="text-muted text-xs mt-1.5">
                    Appears on the cover: <span className="text-gold italic">"A gift for {giftRecipient || '...'}"</span>
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-10 flex items-center justify-between">
        <button type="button" onClick={onBack} className="btn-secondary flex items-center gap-2 px-6 py-3">
          <ArrowLeft className="w-4 h-4" /> {t('nav.back')}
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="btn-primary flex items-center gap-2 px-8 py-3"
        >
          {t('nav.next')}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
