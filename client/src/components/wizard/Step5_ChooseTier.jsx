import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Check, Loader2, AlertCircle, MapPin } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useBook } from '../../context/BookContext.jsx'
import { bookService } from '../../services/bookService.js'
import { BOOK_TIERS } from '../../utils/constants.js'
import { useTranslation } from 'react-i18next'
import VoiceRecorder from '../book/VoiceRecorder.jsx'
import toast from 'react-hot-toast'

const shippingSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name is required'),
  line1: z.string().trim().min(3, 'Address is required'),
  line2: z.string().optional(),
  city: z.string().trim().min(1, 'City is required'),
  state: z.string().optional(),
  postalCode: z.string().trim().min(2, 'Postal code is required'),
  country: z.string().trim().length(2, 'Use 2-letter country code (e.g. FR)').toUpperCase(),
})

const TIERS_ORDER = ['digital', 'printed', 'voice']

export default function Step5_ChooseTier({ onComplete, onBack }) {
  const { wizard, setField } = useBook()
  const { t } = useTranslation('wizard')

  const [selectedTier, setSelectedTier] = useState(wizard.selectedTier || 'printed')
  const [voiceRecorded, setVoiceRecorded] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState(null)

  const needsShipping = ['printed', 'voice'].includes(selectedTier)
  const needsVoice = selectedTier === 'voice'

  const { register, handleSubmit, formState: { errors: shippingErrors } } = useForm({
    resolver: zodResolver(shippingSchema),
    defaultValues: wizard.shippingAddress || {},
  })

  const handleCreate = async (shippingData) => {
    if (needsVoice && !voiceRecorded) {
      setError('Please record and clone your voice before continuing.')
      return
    }

    setCreating(true)
    setError(null)

    try {
      const payload = {
        childId: wizard.childId,
        chosenJob: wizard.chosenJob,
        artStyle: wizard.artStyle,
        storyTheme: wizard.storyTheme,
        episodeNumber: wizard.episodeNumber,
        dedication: wizard.dedication || undefined,
        tier: selectedTier,
        language: wizard.language,
        isGift: wizard.isGift || false,
        giftRecipient: wizard.giftRecipient || undefined,
      }

      const { data } = await bookService.createBook(payload)
      const bookId = data.book._id

      setField('selectedTier', selectedTier)
      if (needsShipping) setField('shippingAddress', shippingData)

      toast.success('Book created! Generating your story now… 🪄')
      onComplete(bookId)
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create book. Please try again.'
      setError(msg)
      toast.error(msg)
    } finally {
      setCreating(false)
    }
  }

  const onFormSubmit = handleSubmit(handleCreate)

  const handleSubmitClick = () => {
    if (!needsShipping) {
      handleCreate({})
    } else {
      onFormSubmit()
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-3xl font-heading font-bold text-white mb-2">
            {t('step5.title')} <span className="gold-text">{t('step5.titleHighlight')}</span>
          </h2>
          <p className="text-muted">{t('step5.subtitle')}</p>
        </motion.div>
      </div>

      <div className="space-y-8">
        {/* Tier cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TIERS_ORDER.map((tierId) => {
            const tier = BOOK_TIERS[tierId]
            const isSelected = selectedTier === tierId
            return (
              <motion.div
                key={tierId}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setSelectedTier(tierId); setError(null) }}
                className={`relative rounded-2xl border-2 cursor-pointer transition-all duration-250 overflow-hidden ${
                  isSelected ? 'border-gold shadow-gold-glow' : 'border-white/10 hover:border-white/25'
                } bg-bg-secondary`}
              >
                {/* Popular badge */}
                {tier.popular && (
                  <div className="bg-gold-gradient text-bg-primary text-xs font-bold text-center py-1.5 tracking-wide">
                    ⭐ Most Popular
                  </div>
                )}

                <div className={`p-5 ${tier.popular ? '' : 'pt-5'}`}>
                  {/* Selected indicator */}
                  <div className={`w-5 h-5 rounded-full border-2 mb-4 flex items-center justify-center transition-all ${
                    isSelected ? 'border-gold bg-gold' : 'border-white/30'
                  }`}>
                    {isSelected && <Check className="w-3 h-3 text-bg-primary" />}
                  </div>

                  <p className="text-muted text-xs font-medium mb-1">{tier.label}</p>
                  <p className={`text-3xl font-heading font-bold mb-1 ${isSelected ? 'text-gold' : 'text-white'}`}>
                    {tier.priceDisplay}
                  </p>
                  <p className="text-muted text-xs italic mb-4">"{tier.tagline}"</p>

                  <ul className="space-y-2">
                    {tier.features.slice(0, 4).map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          isSelected ? 'bg-gold' : 'bg-white/10'
                        }`}>
                          <Check className={`w-2.5 h-2.5 ${isSelected ? 'text-bg-primary' : 'text-cream'}`} />
                        </div>
                        <span className="text-cream leading-relaxed">{f}</span>
                      </li>
                    ))}
                    {tier.features.length > 4 && (
                      <li className="text-muted text-xs pl-6">
                        +{tier.features.length - 4} more included
                      </li>
                    )}
                  </ul>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Shipping form — printed & voice */}
        <AnimatePresence>
          {needsShipping && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="card p-6 border border-white/8">
                <h3 className="text-white font-semibold mb-5 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-gold" />
                  {t('step5.shipping')}
                </h3>
                <form className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="label">Full name</label>
                      <input {...register('fullName')} type="text" placeholder="Sophie Laurent" className="input-field" />
                      {shippingErrors.fullName && <p className="text-error text-xs mt-1">{shippingErrors.fullName.message}</p>}
                    </div>
                    <div className="sm:col-span-2">
                      <label className="label">Address line 1</label>
                      <input {...register('line1')} type="text" placeholder="12 Rue de la Paix" className="input-field" />
                      {shippingErrors.line1 && <p className="text-error text-xs mt-1">{shippingErrors.line1.message}</p>}
                    </div>
                    <div className="sm:col-span-2">
                      <label className="label">Address line 2 <span className="text-muted text-xs">(optional)</span></label>
                      <input {...register('line2')} type="text" placeholder="Apt 3B" className="input-field" />
                    </div>
                    <div>
                      <label className="label">City</label>
                      <input {...register('city')} type="text" placeholder="Paris" className="input-field" />
                      {shippingErrors.city && <p className="text-error text-xs mt-1">{shippingErrors.city.message}</p>}
                    </div>
                    <div>
                      <label className="label">State / Region <span className="text-muted text-xs">(optional)</span></label>
                      <input {...register('state')} type="text" placeholder="Île-de-France" className="input-field" />
                    </div>
                    <div>
                      <label className="label">Postal code</label>
                      <input {...register('postalCode')} type="text" placeholder="75001" className="input-field" />
                      {shippingErrors.postalCode && <p className="text-error text-xs mt-1">{shippingErrors.postalCode.message}</p>}
                    </div>
                    <div>
                      <label className="label">Country code</label>
                      <input {...register('country')} type="text" placeholder="FR" maxLength={2} className="input-field uppercase" />
                      {shippingErrors.country && <p className="text-error text-xs mt-1">{shippingErrors.country.message}</p>}
                    </div>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Voice recorder — voice tier only */}
        <AnimatePresence>
          {needsVoice && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="card p-6 border border-gold/25">
                <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                  🎙️ Record your voice
                </h3>
                <p className="text-muted text-sm mb-5">
                  Record at least 30 seconds of your natural speaking voice. ElevenLabs will clone it to narrate all 32 pages.
                </p>
                <VoiceRecorder onVoiceReady={() => setVoiceRecorded(true)} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Order summary */}
        <div className="bg-bg-secondary rounded-xl p-5 border border-white/8 space-y-3">
          <h3 className="text-white font-semibold">{t('step5.orderSummary')}</h3>
          <div className="flex justify-between text-sm">
            <span className="text-muted">{BOOK_TIERS[selectedTier]?.label}</span>
            <span className="text-white font-medium">{BOOK_TIERS[selectedTier]?.priceDisplay}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted">Story generation</span>
            <span className="text-success text-xs">Included</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted">AI illustrations (32 pages)</span>
            <span className="text-success text-xs">Included</span>
          </div>
          {needsShipping && (
            <div className="flex justify-between text-sm">
              <span className="text-muted">Standard shipping</span>
              <span className="text-success text-xs">Included</span>
            </div>
          )}
          <div className="border-t border-white/10 pt-3 flex justify-between">
            <span className="text-white font-semibold">Total</span>
            <span className="text-gold font-bold text-lg">{BOOK_TIERS[selectedTier]?.priceDisplay}</span>
          </div>
          <p className="text-muted text-xs">
            💳 You'll complete payment on the next screen via Stripe. Preview all 32 pages before paying.
          </p>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-2 text-error text-sm bg-error/10 border border-error/20 rounded-xl p-3"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="mt-10 flex items-center justify-between">
        <button type="button" onClick={onBack} className="btn-secondary flex items-center gap-2 px-6 py-3">
          <ArrowLeft className="w-4 h-4" /> {t('nav.back')}
        </button>
        <button
          type="button"
          onClick={handleSubmitClick}
          disabled={creating}
          className="btn-primary flex items-center gap-2 px-8 py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed animate-pulse-gold"
        >
          {creating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {t('step5.creating')}
            </>
          ) : (
            <>
              🪄 {t('step5.createBook')} {BOOK_TIERS[selectedTier]?.priceDisplay}
            </>
          )}
        </button>
      </div>
    </div>
  )
}
