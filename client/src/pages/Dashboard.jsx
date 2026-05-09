import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Download, Truck, BookOpen, RefreshCw, Eye,
  ChevronRight, ChevronLeft, CheckCircle, Loader2,
  LogOut, Sparkles, Share2, BookMarked,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { bookService } from '../services/bookService.js'
import { orderService } from '../services/orderService.js'
import { BOOK_TIERS, POLLING_INTERVAL_MS, ORDER_STATUS } from '../utils/constants.js'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'

// ── Helpers ────────────────────────────────────────────────────────────────────

function progressPercent(p) {
  if (!p) return 0
  let pct = 0
  if (p.storyDone) pct += 10
  pct += ((p.imagesCompleted || 0) / 16) * 60
  if (p.voiceCompleted > 0) pct += ((p.voiceCompleted || 0) / 16) * 20
  if (p.pdfDone) pct += 10
  return Math.min(Math.round(pct), 100)
}

function formatDate(iso) {
  if (!iso) return ''
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso))
}

const STATUS_BADGE = {
  draft:             { i18nKey: 'draft',        color: 'text-muted bg-muted/10 border-muted/20' },
  generating_story:  { i18nKey: 'writing',      color: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
  generating_images: { i18nKey: 'illustrating', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
  generating_voice:  { i18nKey: 'recording',    color: 'text-purple-400 bg-purple-400/10 border-purple-400/20' },
  assembling_pdf:    { i18nKey: 'assembling',   color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
  ready:             { i18nKey: 'ready',         color: 'text-success bg-success/10 border-success/20' },
  failed:            { i18nKey: 'failed',        color: 'text-error bg-error/10 border-error/20' },
}

const GENERATING_STATUSES = new Set([
  'generating_story', 'generating_images', 'generating_voice', 'assembling_pdf',
])

const ORDER_BADGE = {
  pending:        { i18nKey: 'awaitingPayment', color: 'text-muted' },
  paid:           { i18nKey: 'paid',            color: 'text-success' },
  generating:     { i18nKey: 'generating',      color: 'text-amber-400' },
  print_submitted:{ i18nKey: 'sentToPrint',     color: 'text-blue-400' },
  print_confirmed:{ i18nKey: 'inProduction',    color: 'text-blue-400' },
  shipped:        { i18nKey: 'shipped',          color: 'text-gold' },
  delivered:      { i18nKey: 'delivered',        color: 'text-success' },
  failed:         { i18nKey: 'paymentFailed',   color: 'text-error' },
  refunded:       { i18nKey: 'refunded',         color: 'text-muted' },
}

// ── Nav ────────────────────────────────────────────────────────────────────────

function DashNav({ user, onLogout }) {
  const { t } = useTranslation('common')
  const initials = [user?.firstName?.[0], user?.lastName?.[0]].filter(Boolean).join('').toUpperCase() || '?'

  return (
    <nav className="sticky top-0 z-30 bg-bg-primary/95 backdrop-blur border-b border-white/8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <Link to="/" className="font-heading font-bold text-gold text-lg tracking-tight">
          Hero Kids
        </Link>
        <div className="flex items-center gap-3">
          {user?.isAdmin && (
            <Link
              to="/admin"
              className="px-3 py-1.5 rounded-lg border border-gold/30 text-gold text-xs font-medium hover:bg-gold/10 transition-colors"
            >
              Admin
            </Link>
          )}
          <Link
            to="/create"
            className="btn-primary flex items-center gap-1.5 px-4 py-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t('dashboard.newBook')}</span>
          </Link>
          <Link
            to="/account"
            className="w-8 h-8 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center text-gold text-xs font-bold hover:bg-gold/30 transition-colors"
            title="Account"
          >
            {initials}
          </Link>
          <button
            onClick={onLogout}
            className="p-2 text-muted hover:text-white transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </nav>
  )
}

// ── Book card ──────────────────────────────────────────────────────────────────

function BookCard({ book, order, onDownload, onRetry, downloading }) {
  const navigate = useNavigate()
  const { t } = useTranslation('common')
  const status = book.status
  const badge = STATUS_BADGE[status] || STATUS_BADGE.draft
  const tier = BOOK_TIERS[book.tier] || BOOK_TIERS.digital
  const pct = GENERATING_STATUSES.has(status) ? progressPercent(book.generationProgress) : null
  const pages = book.story?.pages || []
  const coverIdx = book.coverPageIndex || 0
  const coverUrl = (pages[coverIdx]?.imageUrl || pages.find((p) => p.imageUrl)?.imageUrl) || null
  const childName = book.childId?.name || 'Your hero'
  const childPhoto = book.childId?.photoUrl || null
  const lastPage = status === 'ready' ? parseInt(localStorage.getItem(`rprog-${book._id}`) || '1', 10) : 1

  const handleShare = async () => {
    const url = `${window.location.origin}/read/${book._id}/1`
    try {
      if (navigator.share) { await navigator.share({ title: book.title, url }); return }
    } catch {}
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Link copied!')
    } catch { toast.error('Could not copy link') }
  }

  const orderBadge = order ? (ORDER_BADGE[order.status] || ORDER_BADGE.pending) : null
  const isShipped = order && ['shipped', 'delivered'].includes(order.status)
  const canDownload = order && order.isPaid && status === 'ready'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="card border border-white/8 hover:border-white/15 transition-colors overflow-hidden flex flex-col"
    >
      {/* Cover thumbnail */}
      <div
        className="relative aspect-square bg-bg-primary overflow-hidden cursor-pointer group"
        onClick={() => navigate(`/preview/${book._id}`)}
      >
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={book.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl opacity-30">
            {GENERATING_STATUSES.has(status) ? '✨' : status === 'failed' ? '❌' : '📖'}
          </div>
        )}

        {/* Status badge overlay */}
        <div className="absolute top-2 left-2">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border backdrop-blur ${badge.color}`}>
            {t(`dashboard.status.${badge.i18nKey}`)}
          </span>
        </div>

        {/* Tier badge */}
        <div className="absolute top-2 right-2">
          <span className="text-xs bg-bg-primary/80 backdrop-blur text-muted px-2 py-0.5 rounded-full">
            {tier.label.split(' ')[0]}
          </span>
        </div>

        {/* Progress bar (generating) */}
        {pct !== null && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-bg-primary/60">
            <motion.div
              className="h-full bg-gold-gradient"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6 }}
            />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div>
          <h3 className="text-white font-semibold text-sm leading-tight line-clamp-2 mb-1">
            {book.title || `${childName}'s Adventure`}
          </h3>
          <div className="flex items-center gap-2">
            {childPhoto && (
              <img src={childPhoto} alt={childName} className="w-5 h-5 rounded-full object-cover" />
            )}
            <span className="text-muted text-xs">{childName}</span>
            <span className="text-white/20 text-xs">·</span>
            <span className="text-muted text-xs">{formatDate(book.createdAt)}</span>
          </div>
        </div>

        {/* Order status */}
        {orderBadge && (
          <p className={`text-xs font-medium ${orderBadge.color}`}>
            {t(`dashboard.order.${orderBadge.i18nKey}`)}
            {order?.gelato?.trackingNumber && (
              <span className="text-muted ml-1">— {order.gelato.trackingNumber}</span>
            )}
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2 mt-auto">
          {/* Preview / Track */}
          <button
            onClick={() => navigate(`/preview/${book._id}`)}
            className="btn-secondary text-xs py-2 flex items-center justify-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5" />
            {GENERATING_STATUSES.has(status) ? t('dashboard.trackProgress') : t('dashboard.preview')}
          </button>

          {/* Read + Share for ready books */}
          {status === 'ready' && (
            <div className="flex gap-2">
              <a
                href={`/read/${book._id}/${lastPage}`}
                className="btn-secondary text-xs py-2 flex-1 flex items-center justify-center gap-1.5"
              >
                <BookMarked className="w-3.5 h-3.5" />
                {lastPage > 1 ? t('dashboard.resumePage', { page: lastPage }) : t('dashboard.read')}
              </a>
              <button
                onClick={handleShare}
                className="btn-secondary text-xs py-2 px-3 flex items-center gap-1"
                title="Share read link"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Download */}
          {canDownload && (
            <button
              onClick={() => onDownload(order._id, order.downloadUrl)}
              disabled={downloading === order._id}
              className="btn-primary text-xs py-2 flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {downloading === order._id ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              {t('dashboard.downloadPdf')}
            </button>
          )}

          {/* Track shipment */}
          {isShipped && order.gelato?.trackingUrl && (
            <a
              href={order.gelato.trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-xs py-2 flex items-center justify-center gap-1.5"
            >
              <Truck className="w-3.5 h-3.5" />
              {t('dashboard.trackShipment')}
            </a>
          )}

          {/* Retry */}
          {status === 'failed' && (
            <button
              onClick={() => onRetry(book._id)}
              className="btn-secondary text-xs py-2 flex items-center justify-center gap-1.5 text-error border-error/30 hover:border-error/50"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {t('dashboard.retryGeneration')}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ── Empty state ────────────────────────────────────────────────────────────────

function EmptyState() {
  const { t } = useTranslation('common')
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="col-span-full text-center py-20"
    >
      <div className="text-6xl mb-5">📖</div>
      <h3 className="text-white font-heading font-bold text-xl mb-2">
        {t('dashboard.noBooks_title')}
      </h3>
      <p className="text-muted text-sm mb-8 max-w-xs mx-auto">
        {t('dashboard.noBooks_desc')}
      </p>
      <Link
        to="/create"
        className="btn-primary inline-flex items-center gap-2 px-8 py-3 animate-pulse-gold"
      >
        <Sparkles className="w-4 h-4" />
        {t('dashboard.createFirstBook')}
      </Link>
    </motion.div>
  )
}

// ── Skeleton ───────────────────────────────────────────────────────────────────

function DashSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="card border border-white/8 overflow-hidden animate-pulse">
          <div className="aspect-square bg-bg-secondary" />
          <div className="p-4 space-y-3">
            <div className="h-3 bg-bg-secondary rounded w-3/4" />
            <div className="h-3 bg-bg-secondary rounded w-1/2" />
            <div className="h-8 bg-bg-secondary rounded-xl mt-4" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Payment success banner ─────────────────────────────────────────────────────

function SuccessBanner({ orderId, onDismiss }) {
  const { t } = useTranslation('common')
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mb-6 flex items-center gap-3 bg-success/10 border border-success/25 rounded-xl p-4"
    >
      <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
      <div className="flex-1">
        <p className="text-white text-sm font-medium">{t('dashboard.paymentSuccess')}</p>
        <p className="text-muted text-xs">{t('dashboard.paymentDesc')}</p>
      </div>
      <button onClick={onDismiss} className="text-muted hover:text-white text-xs flex-shrink-0">
        {t('dashboard.dismiss')}
      </button>
    </motion.div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

const PAGE_SIZE = 12

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation('common')
  const [searchParams, setSearchParams] = useSearchParams()

  const [books, setBooks] = useState([])
  const [ordersMap, setOrdersMap] = useState(new Map())
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [downloading, setDownloading] = useState(null) // orderId being downloaded
  const [showSuccess, setShowSuccess] = useState(false)
  const pollRef = useRef(null)

  // Detect Stripe return URL and verify payment
  const returnOrderId = searchParams.get('order')
  const returnSessionId = searchParams.get('session_id')
  useEffect(() => {
    if (!returnOrderId) return
    setShowSuccess(true)
    setSearchParams({}, { replace: true })
    if (returnSessionId) {
      orderService.verifyPayment(returnOrderId, returnSessionId)
        .then(() => { fetchOrders(); fetchBooks(page) })
        .catch(() => {})
    }
  }, [returnOrderId])

  const fetchOrders = useCallback(async () => {
    try {
      const { data } = await orderService.getMyOrders()
      const map = new Map()
      ;(data.orders || []).forEach((o) => {
        const bId = o.bookId?._id || o.bookId
        if (bId) map.set(bId.toString(), o)
      })
      setOrdersMap(map)
    } catch {}
  }, [])

  const fetchBooks = useCallback(async (pg = 1) => {
    try {
      const { data } = await bookService.getMyBooks(pg)
      setBooks(data.books || [])
      setTotalPages(data.pagination?.totalPages || 1)
    } catch {
      toast.error('Could not load your books.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBooks(page)
    fetchOrders()
  }, [page, fetchBooks, fetchOrders])

  // Poll progress for generating books
  useEffect(() => {
    const generatingBooks = books.filter((b) => GENERATING_STATUSES.has(b.status))
    if (!generatingBooks.length) {
      clearInterval(pollRef.current)
      return
    }

    pollRef.current = setInterval(async () => {
      const updates = await Promise.allSettled(
        generatingBooks.map((b) => bookService.getProgress(b._id))
      )
      let anyReady = false
      setBooks((prev) =>
        prev.map((book) => {
          const idx = generatingBooks.findIndex((g) => g._id === book._id)
          if (idx === -1) return book
          const result = updates[idx]
          if (result.status !== 'fulfilled') return book
          const { status, progress, percentage } = result.value.data
          if (status === 'ready') anyReady = true
          return { ...book, status, generationProgress: progress }
        })
      )
      if (anyReady) {
        fetchOrders() // refresh orders in case downloadS3Key was just set
      }
    }, POLLING_INTERVAL_MS)

    return () => clearInterval(pollRef.current)
  }, [books.map((b) => `${b._id}:${b.status}`).join(',')])

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const handleDownload = async (orderId, cachedUrl) => {
    if (cachedUrl && new Date(cachedUrl.expiresAt) > new Date()) {
      window.open(cachedUrl, '_blank')
      return
    }
    setDownloading(orderId)
    try {
      const { data } = await orderService.getDownloadUrl(orderId)
      window.open(data.downloadUrl, '_blank')
    } catch (err) {
      const msg = err.response?.status === 202
        ? 'Your PDF is still being generated — please try again in a moment.'
        : 'Download failed. Please try again.'
      toast.error(msg)
    } finally {
      setDownloading(null)
    }
  }

  const handleRetry = async (bookId) => {
    try {
      await bookService.generateStory(bookId)
      setBooks((prev) =>
        prev.map((b) => b._id === bookId ? { ...b, status: 'generating_story' } : b)
      )
      toast.success('Generation restarted!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not retry — please try again.')
    }
  }

  const generatingCount = books.filter((b) => GENERATING_STATUSES.has(b.status)).length

  return (
    <div className="min-h-screen bg-bg-primary">
      <DashNav user={user} onLogout={handleLogout} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome header */}
        <div className="mb-8">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl font-heading font-bold text-white">
              {t('dashboard.welcome', { name: user?.firstName || 'Hero' })}
            </h1>
            <p className="text-muted text-sm mt-1">
              {books.length > 0
                ? t('dashboard.booksCount', { count: books.length }) + (generatingCount > 0 ? ' ' + t('dashboard.generatingCount', { count: generatingCount }) : '')
                : t('dashboard.noBooks')}
            </p>
          </motion.div>
        </div>

        {/* Stripe return success banner */}
        <AnimatePresence>
          {showSuccess && (
            <SuccessBanner
              orderId={returnOrderId}
              onDismiss={() => setShowSuccess(false)}
            />
          )}
        </AnimatePresence>

        {/* Books grid */}
        {loading ? (
          <DashSkeleton />
        ) : books.length === 0 ? (
          <div className="grid grid-cols-1">
            <EmptyState />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {books.map((book) => (
              <BookCard
                key={book._id}
                book={book}
                order={ordersMap.get(book._id?.toString())}
                onDownload={handleDownload}
                onRetry={handleRetry}
                downloading={downloading}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-10">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary p-2.5 disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-muted text-sm">
              {t('common.page')} {page} {t('common.of')} {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-secondary p-2.5 disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Create new CTA (when books exist) */}
        {!loading && books.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-12 text-center"
          >
            <Link
              to="/create"
              className="btn-primary inline-flex items-center gap-2 px-8 py-3 animate-pulse-gold"
            >
              <Plus className="w-4 h-4" />
              {t('dashboard.createAnother')}
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  )
}
