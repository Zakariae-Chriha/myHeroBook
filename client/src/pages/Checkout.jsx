import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { loadStripe } from '@stripe/stripe-js'
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js'
import { AlertCircle, ArrowLeft, BookOpen, Tag, Check, Loader2 } from 'lucide-react'
import { bookService } from '../services/bookService.js'
import { orderService } from '../services/orderService.js'
import { BOOK_TIERS } from '../utils/constants.js'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

// ── Loading skeleton ───────────────────────────────────────────────────────────

function CheckoutSkeleton() {
  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center">
      <div className="text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          className="inline-block mb-4"
        >
          <BookOpen className="w-10 h-10 text-gold" />
        </motion.div>
        <p className="text-muted text-sm">Preparing secure checkout…</p>
      </div>
    </div>
  )
}

function CheckoutError({ message, bookId }) {
  const { t } = useTranslation('common')
  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-14 h-14 rounded-full bg-error/10 border border-error/20 flex items-center justify-center mx-auto mb-5">
          <AlertCircle className="w-7 h-7 text-error" />
        </div>
        <h2 className="text-xl font-heading font-bold text-white mb-3">{t('checkout.unavailable')}</h2>
        <p className="text-muted text-sm mb-8">{message}</p>
        <div className="flex gap-3 justify-center">
          {bookId && (
            <Link to={`/preview/${bookId}`} className="btn-secondary flex items-center gap-2 px-5 py-2.5 text-sm">
              <ArrowLeft className="w-4 h-4" /> {t('checkout.backToPreview')}
            </Link>
          )}
          <Link to="/dashboard" className="btn-secondary px-5 py-2.5 text-sm">{t('checkout.backToDashboard')}</Link>
        </div>
      </div>
    </div>
  )
}

// ── Promo code section ─────────────────────────────────────────────────────────

function PromoSection({ tier, onApply }) {
  const { t } = useTranslation('common')
  const [code, setCode] = useState('')
  const [discount, setDiscount] = useState(null)
  const [validating, setValidating] = useState(false)

  const handleApply = async () => {
    if (!code.trim()) return
    setValidating(true)
    try {
      const { data } = await orderService.validatePromo(code.trim(), tier)
      setDiscount(data.discount)
      onApply(data.discount)
      toast.success(`${data.discount.code} applied!`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid promo code')
      setDiscount(null)
      onApply(null)
    } finally {
      setValidating(false)
    }
  }

  const handleRemove = () => {
    setCode('')
    setDiscount(null)
    onApply(null)
  }

  return (
    <div className="space-y-2">
      <p className="text-muted text-xs font-medium">{t('checkout.promo')}</p>
      {discount ? (
        <div className="flex items-center justify-between bg-success/10 border border-success/20 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-success" />
            <span className="text-success text-sm font-medium">{discount.code}</span>
            <span className="text-muted text-xs">
              {discount.type === 'percentage' ? `${discount.value}% off` : `€${(discount.amountOff / 100).toFixed(2)} off`}
            </span>
          </div>
          <button onClick={handleRemove} className="text-muted hover:text-white text-xs">{t('checkout.remove')}</button>
        </div>
      ) : (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleApply()}
              placeholder={t('checkout.promoPlaceholder')}
              className="input-field pl-9 text-sm py-2.5 uppercase tracking-widest"
            />
          </div>
          <button
            onClick={handleApply}
            disabled={!code.trim() || validating}
            className="btn-secondary px-4 text-sm disabled:opacity-50"
          >
            {validating ? <Loader2 className="w-4 h-4 animate-spin" /> : t('checkout.apply')}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Order summary ──────────────────────────────────────────────────────────────

function OrderSummary({ book, tier, discount, promoCode, onPromoApply, onProceed, proceeding }) {
  const { t } = useTranslation('common')
  if (!book || !tier) return null

  const basePrice = tier.priceCents || 0
  const discountAmount = discount ? discount.amountOff : 0
  const finalPrice = basePrice - discountAmount

  return (
    <div className="space-y-6">
      <div className="card p-6 border border-white/8 space-y-4">
        <h3 className="text-white font-semibold">{t('checkout.orderSummary')}</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">{t('checkout.bookTitle')}</span>
            <span className="text-cream font-medium max-w-[180px] text-right">{book.title || 'Your Hero Book'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">{t('checkout.format')}</span>
            <span className="text-cream">{tier.label}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">{t('checkout.illustrations')}</span>
            <span className="text-success text-xs">{t('checkout.included')}</span>
          </div>
          {['printed', 'voice'].includes(book.tier) && (
            <div className="flex justify-between">
              <span className="text-muted">{t('checkout.shipping')}</span>
              <span className="text-success text-xs">{t('checkout.included')}</span>
            </div>
          )}
          {discount && (
            <div className="flex justify-between text-success">
              <span>Promo ({discount.code})</span>
              <span>-€{(discountAmount / 100).toFixed(2).replace('.', ',')}</span>
            </div>
          )}
        </div>

        <div className="border-t border-white/10 pt-3 flex justify-between">
          <span className="text-white font-semibold">{t('checkout.total')}</span>
          <div className="text-right">
            {discount && (
              <span className="text-muted text-sm line-through mr-2">{tier.priceDisplay}</span>
            )}
            <span className="text-gold font-bold text-lg">
              €{(finalPrice / 100).toFixed(2).replace('.', ',')}
            </span>
          </div>
        </div>

        <ul className="space-y-1.5 pt-1">
          {(tier.features || []).slice(0, 3).map((f) => (
            <li key={f} className="text-muted text-xs flex items-center gap-2">
              <span className="text-gold">✓</span> {f}
            </li>
          ))}
        </ul>
      </div>

      <PromoSection tier={book.tier} onApply={onPromoApply} />

      <button
        onClick={onProceed}
        disabled={proceeding}
        className="btn-primary w-full py-3.5 text-base flex items-center justify-center gap-2 disabled:opacity-60 animate-pulse-gold"
      >
        {proceeding ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
        {proceeding ? t('checkout.preparing') : t('checkout.proceed')}
      </button>

      <p className="text-muted text-xs text-center">{t('checkout.secureStripe')}</p>

      <Link to={`/preview/${book._id}`} className="text-xs text-gold hover:underline block text-center">
        {t('checkout.backToPreview')}
      </Link>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function Checkout() {
  const { bookId } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation('common')

  const [phase, setPhase] = useState('summary') // 'summary' | 'payment'
  const [clientSecret, setClientSecret] = useState(null)
  const [book, setBook] = useState(null)
  const [promoCode, setPromoCode] = useState(null)
  const [discount, setDiscount] = useState(null)
  const [error, setError] = useState(null)
  const [proceeding, setProceeding] = useState(false)

  const tier = book ? (BOOK_TIERS[book.tier] || BOOK_TIERS.digital) : null

  useEffect(() => {
    bookService.getBook(bookId)
      .then(({ data }) => {
        const b = data.book
        if (!b) { setError('Book not found.'); return }
        if (!b.tier) { setError('No tier selected. Please complete the book creation wizard.'); return }
        setBook(b)
      })
      .catch(() => setError('Failed to load book. Please try again.'))
  }, [bookId])

  const handleProceed = async () => {
    setProceeding(true)
    try {
      const { data } = await orderService.createCheckoutSession({
        bookId,
        tier: book.tier,
        promoCode: promoCode || undefined,
      })
      setClientSecret(data.clientSecret)
      setPhase('payment')
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to start checkout. Please try again.'
      setError(msg)
      toast.error(msg)
    } finally {
      setProceeding(false)
    }
  }

  if (error) return <CheckoutError message={error} bookId={bookId} />

  if (phase === 'payment' && clientSecret) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <button onClick={() => setPhase('summary')} className="inline-flex items-center gap-2 text-muted hover:text-white text-sm mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> {t('checkout.backToSummary')}
          </button>
          <h1 className="text-3xl font-heading font-bold text-white mb-6">
            {t('checkout.paymentTitle')}
          </h1>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl overflow-hidden border border-white/8 bg-white">
            <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-10">
        <Link to={`/preview/${bookId}`} className="inline-flex items-center gap-2 text-muted hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> {t('checkout.backToPreview')}
        </Link>
        <h1 className="text-3xl font-heading font-bold text-white mb-8">
          {t('checkout.title')}
        </h1>

        {!book ? (
          <CheckoutSkeleton />
        ) : (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <OrderSummary
              book={book}
              tier={tier}
              discount={discount}
              promoCode={promoCode}
              onPromoApply={(d) => { setDiscount(d); setPromoCode(d?.code || null) }}
              onProceed={handleProceed}
              proceeding={proceeding}
            />
          </motion.div>
        )}
      </div>
    </div>
  )
}
