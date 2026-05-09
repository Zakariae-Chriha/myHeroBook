import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ArrowLeft, PenLine } from 'lucide-react'
import { useBook } from '../../context/BookContext.jsx'
import { useTranslation } from 'react-i18next'
import { DREAM_JOBS } from '../../utils/constants.js'

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
}
const cardVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 10 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.3 } },
}

export default function Step3_ChooseJob({ onBack }) {
  const { wizard, setField, nextStep } = useBook()
  const { t } = useTranslation('wizard')

  const [selected, setSelected] = useState(wizard.chosenJob || null)
  const [customJob, setCustomJob] = useState(wizard.customJob || '')
  const [showCustom, setShowCustom] = useState(Boolean(wizard.customJob))
  const [error, setError] = useState(null)

  const selectedJobInfo = DREAM_JOBS.find((j) => j.id === selected)
  const effectiveJob = showCustom
    ? customJob.trim()
    : selectedJobInfo?.label || null

  const handleSelect = (jobId) => {
    setSelected(jobId)
    setShowCustom(false)
    setCustomJob('')
    setError(null)
  }

  const handleNext = () => {
    if (!effectiveJob) {
      setError('Please choose a dream job to continue.')
      return
    }
    setField('chosenJob', effectiveJob)
    setField('customJob', showCustom ? customJob.trim() : '')
    nextStep()
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-3xl font-heading font-bold text-white mb-2">
            {t('step3.title')}{' '}
            <span className="gold-text">{t('step3.titleHighlight')}</span>
          </h2>
          <p className="text-muted">{t('step3.subtitle')}</p>
        </motion.div>
      </div>

      {/* Job grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
      >
        {DREAM_JOBS.map((job) => {
          const isSelected = selected === job.id && !showCustom
          return (
            <motion.button
              key={job.id}
              type="button"
              variants={cardVariants}
              onClick={() => handleSelect(job.id)}
              whileTap={{ scale: 0.96 }}
              className={`relative flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer text-center ${
                isSelected
                  ? 'border-gold bg-gold/10 shadow-gold-glow'
                  : 'border-white/10 hover:border-white/30 bg-bg-secondary hover:bg-bg-secondary/80'
              }`}
            >
              {/* Selected ring animation */}
              {isSelected && (
                <motion.div
                  className="absolute inset-0 rounded-2xl border-2 border-gold"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: [0, 1, 0], scale: [0.85, 1.05, 1] }}
                  transition={{ duration: 0.5 }}
                />
              )}

              <span className="text-4xl">{job.emoji}</span>
              <div>
                <p className={`font-semibold text-sm ${isSelected ? 'text-gold' : 'text-white'}`}>
                  {job.label}
                </p>
              </div>

              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2 w-5 h-5 rounded-full bg-gold flex items-center justify-center"
                >
                  <span className="text-bg-primary text-xs font-bold">✓</span>
                </motion.div>
              )}
            </motion.button>
          )
        })}

        {/* Custom job card */}
        <motion.button
          type="button"
          variants={cardVariants}
          onClick={() => { setShowCustom(true); setSelected(null) }}
          whileTap={{ scale: 0.96 }}
          className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer ${
            showCustom
              ? 'border-gold bg-gold/10 shadow-gold-glow'
              : 'border-dashed border-white/20 hover:border-gold/40 bg-bg-secondary/50'
          }`}
        >
          <PenLine className={`w-8 h-8 ${showCustom ? 'text-gold' : 'text-muted'}`} />
          <p className={`font-semibold text-sm ${showCustom ? 'text-gold' : 'text-muted'}`}>
            Something else…
          </p>
        </motion.button>
      </motion.div>

      {/* Custom job input */}
      <AnimatePresence>
        {showCustom && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-5 overflow-hidden"
          >
            <div className="card p-5 border border-gold/30">
              <label className="label">What is their dream job?</label>
              <input
                type="text"
                value={customJob}
                onChange={(e) => { setCustomJob(e.target.value); setError(null) }}
                placeholder="e.g. Marine Biologist, Game Designer, Ballet Dancer…"
                className="input-field"
                autoFocus
                maxLength={100}
              />
              <p className="text-muted text-xs mt-2">
                Any job works — the AI will craft a unique story around it.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected job description */}
      <AnimatePresence>
        {selectedJobInfo && !showCustom && (
          <motion.div
            key={selectedJobInfo.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-5 bg-gold/5 border border-gold/20 rounded-xl p-4 flex items-center gap-4"
          >
            <span className="text-4xl">{selectedJobInfo.emoji}</span>
            <div>
              <p className="text-gold font-semibold">{selectedJobInfo.label}</p>
              <p className="text-cream text-sm">{selectedJobInfo.description}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Book title preview */}
      <AnimatePresence>
        {effectiveJob && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-5 bg-bg-secondary rounded-xl p-4 text-center border border-white/5"
          >
            <p className="text-muted text-xs mb-1">Your book will be called…</p>
            <p className="font-accent text-gold text-xl">
              {wizard.childName || 'Your child'} and the {effectiveJob} Adventure!
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-4 text-error text-sm"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

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
