import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { RotateCcw, BookOpen, Check, ShoppingCart, Download, Share2, BookMarked, Star } from 'lucide-react'
import { bookService } from '../services/bookService.js'
import { BOOK_TIERS, POLLING_INTERVAL_MS } from '../utils/constants.js'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'

const STAGE_CONFIG = {
  draft:             { label: 'Preparing your adventure…',   emoji: '✨', pct: 2  },
  generating_story:  { label: 'Writing your story…',         emoji: '✍️', pct: 8  },
  generating_images: { label: 'Painting your illustrations…', emoji: '🎨', pct: 20 },
  generating_voice:  { label: 'Recording narration…',        emoji: '🎙️', pct: 82 },
  assembling_pdf:    { label: 'Binding your book…',          emoji: '📖', pct: 96 },
  ready:             { label: 'Your book is ready!',         emoji: '🎉', pct: 100 },
  failed:            { label: 'Something went wrong',        emoji: '❌', pct: 0  },
}

// ── Generating view ────────────────────────────────────────────────────────────

function GeneratingView({ status, percentage, progress, bookTitle, onRetry, retrying, partialPages }) {
  const stage = STAGE_CONFIG[status] || STAGE_CONFIG.draft
  const displayPct = Math.max(stage.pct, percentage || 0)
  const completedPages = partialPages.filter((p) => p.imageUrl)

  return (
    <div className="min-h-screen bg-bg-primary pb-20">
      <div className="max-w-2xl mx-auto px-4 pt-16 text-center">
        {/* Animated book icon */}
        <motion.div
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="text-7xl mb-6 block"
        >
          {stage.emoji}
        </motion.div>

        <h1 className="text-2xl font-heading font-bold text-white mb-2">
          {bookTitle ? `"${bookTitle}"` : 'Your book is being created'}
        </h1>
        <p className="text-muted mb-10">{stage.label}</p>

        {/* Progress bar */}
        <div className="relative mb-4">
          <div className="h-3 bg-bg-secondary rounded-full overflow-hidden border border-white/8">
            <motion.div
              className="h-full rounded-full bg-gold-gradient"
              initial={{ width: '0%' }}
              animate={{ width: `${displayPct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          <span className="absolute right-0 -top-6 text-xs text-gold font-medium">
            {displayPct}%
          </span>
        </div>

        {/* Stage milestones */}
        <div className="flex justify-between text-xs mt-6 mb-8">
          {[
            { key: 'story', label: 'Story', done: progress?.storyDone },
            { key: 'images', label: `Images ${progress?.imagesCompleted ?? 0}/16`, done: (progress?.imagesCompleted ?? 0) >= 16 },
            { key: 'pdf', label: 'PDF', done: progress?.pdfDone },
          ].map(({ key, label, done }) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${done ? 'bg-gold' : 'bg-white/10'}`}>
                {done && <Check className="w-2.5 h-2.5 text-bg-primary" />}
              </div>
              <span className={done ? 'text-gold' : 'text-muted'}>{label}</span>
            </div>
          ))}
        </div>

        <p className="text-muted text-sm">
          ✉️ We'll email you when it's ready — no need to wait here.
        </p>
        <Link to="/dashboard" className="inline-block mt-3 text-sm text-gold hover:underline">
          Go to dashboard →
        </Link>

        {/* Manual retry */}
        {(status === 'generating_story' || status === 'generating_images') && onRetry && (
          <div className="mt-8 pt-6 border-t border-white/8">
            <p className="text-muted text-xs mb-3">Taking too long or got an error?</p>
            <button
              onClick={onRetry}
              disabled={retrying}
              className="btn-secondary flex items-center gap-2 mx-auto px-6 py-2 text-sm disabled:opacity-50"
            >
              {retrying ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                  <RotateCcw className="w-3.5 h-3.5" />
                </motion.div>
              ) : (
                <RotateCcw className="w-3.5 h-3.5" />
              )}
              {status === 'generating_images' ? 'Restart image generation' : 'Retry story generation'}
            </button>
          </div>
        )}
      </div>

      {/* ── Live page reveal ────────────────────────────────────────────── */}
      {(status === 'generating_images' || completedPages.length > 0) && (
        <div className="max-w-6xl mx-auto px-4 mt-14">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-px flex-1 bg-white/8" />
            <p className="text-muted text-xs uppercase tracking-widest">
              {completedPages.length > 0
                ? `${completedPages.length} of 16 pages illustrated`
                : 'Illustrations starting…'}
            </p>
            <div className="h-px flex-1 bg-white/8" />
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2.5">
            {Array.from({ length: 16 }, (_, i) => {
              const page = partialPages.find((p) => p.pageNumber === i + 1)
              return page?.imageUrl ? (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="group relative"
                >
                  <div className="aspect-square rounded-lg overflow-hidden border border-gold/30 shadow-gold-glow">
                    <img
                      src={page.imageUrl}
                      alt={`Page ${i + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <p className="text-center text-muted text-xs mt-1 opacity-60">{i + 1}</p>
                </motion.div>
              ) : (
                <div key={i} className="group">
                  <div className="aspect-square rounded-lg bg-bg-secondary border border-white/5 flex items-center justify-center overflow-hidden relative">
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/4 to-transparent"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: 'linear', delay: i * 0.1 }}
                    />
                    <span className="text-white/15 text-lg">🎨</span>
                  </div>
                  <p className="text-center text-muted text-xs mt-1 opacity-30">{i + 1}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Failed view ────────────────────────────────────────────────────────────────

function FailedView({ reason, onRetry, retrying }) {
  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="text-6xl mb-6">😔</div>
        <h2 className="text-2xl font-heading font-bold text-white mb-3">
          Generation failed
        </h2>
        <p className="text-muted mb-2 text-sm">
          {reason || 'Something went wrong while creating your book.'}
        </p>
        <p className="text-muted text-sm mb-8">
          This is usually a temporary issue. Please try again.
        </p>
        <button
          onClick={onRetry}
          disabled={retrying}
          className="btn-primary flex items-center gap-2 mx-auto px-8 py-3 disabled:opacity-50"
        >
          {retrying ? (
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
              <RotateCcw className="w-4 h-4" />
            </motion.div>
          ) : (
            <RotateCcw className="w-4 h-4" />
          )}
          Try again
        </button>
      </div>
    </div>
  )
}

// ── Single page card ───────────────────────────────────────────────────────────

function PageCard({ page, onClick, onBroken, isCover, onSetCover }) {
  const { t } = useTranslation('common')
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className="group cursor-pointer rounded-xl overflow-hidden border border-white/8 hover:border-gold/40 hover:shadow-gold-glow bg-bg-secondary transition-all duration-200 relative"
    >
      {/* Illustration */}
      <div className="aspect-square overflow-hidden bg-bg-primary" onClick={() => onClick(page)}>
        {page.imageUrl ? (
          <img
            src={page.imageUrl}
            alt={`Page ${page.pageNumber}`}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => onBroken?.(page.pageNumber)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl opacity-30">
            🎨
          </div>
        )}
        {/* Set as cover button */}
        <button
          onClick={(e) => { e.stopPropagation(); onSetCover?.(page.pageNumber - 1) }}
          title={isCover ? t('preview.coverPage') : t('preview.setAsCover')}
          className={`absolute top-2 right-2 p-1.5 rounded-lg backdrop-blur transition-all ${
            isCover
              ? 'bg-gold text-bg-primary opacity-100'
              : 'bg-bg-primary/70 text-muted opacity-0 group-hover:opacity-100 hover:text-gold'
          }`}
        >
          <Star className="w-3 h-3" fill={isCover ? 'currentColor' : 'none'} />
        </button>
      </div>
      {/* Page text preview */}
      <div className="p-3" onClick={() => onClick(page)}>
        <span className="text-muted text-xs block mb-1">Page {page.pageNumber}</span>
        <p className="text-cream text-xs leading-relaxed line-clamp-3">{page.text}</p>
      </div>
    </motion.div>
  )
}

// ── Page lightbox ──────────────────────────────────────────────────────────────

function PageLightbox({ page, onClose, onPrev, onNext, hasPrev, hasNext }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight' && hasNext) onNext()
      if (e.key === 'ArrowLeft' && hasPrev) onPrev()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, onPrev, onNext, hasPrev, hasNext])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="max-w-2xl w-full bg-bg-secondary rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
      >
        {page.imageUrl && (
          <img src={page.imageUrl} alt={`Page ${page.pageNumber}`} className="w-full aspect-square object-cover" />
        )}
        <div className="p-6">
          <p className="text-cream leading-relaxed text-base">{page.text}</p>
          <div className="flex items-center justify-between mt-4">
            <button
              onClick={onPrev}
              disabled={!hasPrev}
              className="btn-secondary px-4 py-2 text-sm disabled:opacity-30"
            >
              ← Prev
            </button>
            <span className="text-muted text-sm">Page {page.pageNumber} / 16</span>
            <button
              onClick={onNext}
              disabled={!hasNext}
              className="btn-secondary px-4 py-2 text-sm disabled:opacity-30"
            >
              Next →
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Ready view ─────────────────────────────────────────────────────────────────

function ReadyView({ book, pages, onBuy, onRegenerateImages, onDownload, onSetCover, coverPageIndex }) {
  const { t } = useTranslation('common')
  const [lightboxPage, setLightboxPage] = useState(null)
  const [regenerating, setRegenerating] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [brokenImages, setBrokenImages] = useState(new Set())
  const tier = BOOK_TIERS[book.tier] || BOOK_TIERS.digital
  const lightboxIdx = lightboxPage ? pages.findIndex((p) => p.pageNumber === lightboxPage.pageNumber) : -1
  const badImages = pages.filter(
    (p) => !p.imageUrl || !p.imageUrl.includes('cloudinary.com')
  ).length + brokenImages.size
  const lastPage = parseInt(localStorage.getItem(`rprog-${book._id}`) || '1', 10)

  const handleRegenerate = async () => {
    setRegenerating(true)
    setBrokenImages(new Set())
    try {
      await onRegenerateImages()
    } finally {
      setRegenerating(false)
    }
  }

  const handleDownload = async () => {
    setDownloading(true)
    try {
      await onDownload()
    } finally {
      setDownloading(false)
    }
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/read/${book._id}/1`
    try {
      if (navigator.share) {
        await navigator.share({ title: book.title || 'Hero Kids StoryLab', url })
        return
      }
    } catch {}
    try {
      await navigator.clipboard.writeText(url)
      toast.success(t('common.linkCopied'))
    } catch {
      toast.error('Could not copy link')
    }
  }

  const markBroken = (pageNumber) =>
    setBrokenImages((prev) => new Set([...prev, pageNumber]))

  return (
    <div className="min-h-screen bg-bg-primary pb-32">
      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <span className="text-gold text-xs font-medium uppercase tracking-widest">Book preview</span>
              <h1 className="text-3xl font-heading font-bold text-white mt-1">
                {book.title || 'Your Hero Book'}
              </h1>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span className="text-muted text-sm">{pages.length} pages generated</span>
                <span className="px-2 py-0.5 rounded-full bg-gold/10 border border-gold/20 text-gold text-xs font-medium">
                  {tier.label}
                </span>
                <a href={`/read/${book._id}/${lastPage}`}
                  className="flex items-center gap-1 text-xs text-cream hover:text-gold transition-colors">
                  <BookMarked className="w-3.5 h-3.5" />
                  {lastPage > 1 ? t('dashboard.resumePage', { page: lastPage }) : t('preview.readBook')}
                </a>
                <button onClick={handleShare}
                  className="flex items-center gap-1 text-xs text-cream hover:text-gold transition-colors">
                  <Share2 className="w-3.5 h-3.5" /> {t('preview.share')}
                </button>
              </div>
            </div>
            {badImages > 0 ? (
              <button
                onClick={handleRegenerate}
                disabled={regenerating}
                className="btn-secondary text-sm flex items-center gap-2 px-4 py-2 border-amber-400/40 text-amber-400 hover:border-amber-400"
              >
                <RotateCcw className={`w-4 h-4 ${regenerating ? 'animate-spin' : ''}`} />
                {regenerating ? 'Starting…' : t('preview.fixImages')}
              </button>
            ) : (
              <div className="flex items-center gap-2 text-success text-sm">
                <div className="w-5 h-5 rounded-full bg-success flex items-center justify-center">
                  <Check className="w-3 h-3 text-bg-primary" />
                </div>
                All illustrations complete
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Pages grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
        >
          {pages.map((page, i) => (
            <motion.div
              key={page.pageNumber}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02, duration: 0.35 }}
            >
              <PageCard
                page={page}
                onClick={setLightboxPage}
                onBroken={markBroken}
                isCover={page.pageNumber - 1 === coverPageIndex}
                onSetCover={onSetCover}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxPage && (
          <PageLightbox
            page={lightboxPage}
            onClose={() => setLightboxPage(null)}
            onPrev={() => lightboxIdx > 0 && setLightboxPage(pages[lightboxIdx - 1])}
            onNext={() => lightboxIdx < pages.length - 1 && setLightboxPage(pages[lightboxIdx + 1])}
            hasPrev={lightboxIdx > 0}
            hasNext={lightboxIdx < pages.length - 1}
          />
        )}
      </AnimatePresence>

      {/* Fixed CTA bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-bg-primary/95 backdrop-blur border-t border-white/8 px-4 py-4" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          <div className="hidden sm:block">
            <p className="text-white font-semibold leading-tight">{tier.label}</p>
            <p className="text-muted text-sm">{tier.features?.[0]}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
            <button onClick={handleShare} className="flex items-center gap-1.5 text-muted text-sm hover:text-white px-3 py-2.5">
              <Share2 className="w-4 h-4" /> {t('preview.share')}
            </button>
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="flex items-center gap-1.5 text-amber-400 text-sm hover:text-amber-300 disabled:opacity-50 px-3 py-2.5"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`} />
              {regenerating ? 'Starting…' : t('preview.fixImages')}
            </button>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="btn-secondary flex items-center gap-1.5 px-4 py-2.5 text-sm border-green-500/40 text-green-400 hover:border-green-400 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {downloading ? 'Loading…' : 'PDF'}
            </button>
            <button
              onClick={onBuy}
              className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm animate-pulse-gold"
            >
              <ShoppingCart className="w-4 h-4" />
              {t('preview.buyBook')} — {tier.priceDisplay}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function Preview() {
  const { bookId } = useParams()
  const navigate = useNavigate()

  const [book, setBook] = useState(null)
  const [pages, setPages] = useState([])
  const [partialPages, setPartialPages] = useState([])
  const [status, setStatus] = useState('draft')
  const [percentage, setPercentage] = useState(0)
  const [progressDetails, setProgressDetails] = useState(null)
  const [failureReason, setFailureReason] = useState(null)
  const [loading, setLoading] = useState(true)
  const [retrying, setRetrying] = useState(false)
  const [coverPageIndex, setCoverPageIndex] = useState(0)
  const intervalRef = useRef(null)
  const pollCountRef = useRef(0)

  const loadPreviewPages = useCallback(async () => {
    try {
      const { data } = await bookService.getPreviewPages(bookId)
      setPages(data.pages || [])
      if (data.title) setBook((b) => b ? { ...b, title: data.title } : b)
    } catch {
      toast.error('Could not load preview pages.')
    }
  }, [bookId])

  const startPolling = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    pollCountRef.current = 0

    intervalRef.current = setInterval(async () => {
      try {
        const { data } = await bookService.getProgress(bookId)
        setStatus(data.status)
        setPercentage(data.percentage || 0)
        setProgressDetails(data.progress || null)

        if (data.status === 'ready') {
          clearInterval(intervalRef.current)
          await loadPreviewPages()
          setPartialPages([])
          return
        }

        if (data.status === 'failed') {
          setFailureReason(data.failureReason || null)
          clearInterval(intervalRef.current)
          return
        }

        // During image generation, fetch partial pages every 2 polls so user sees them appear
        pollCountRef.current++
        if (data.status === 'generating_images' && pollCountRef.current % 2 === 0) {
          try {
            const { data: pagesData } = await bookService.getPreviewPages(bookId)
            if (pagesData.pages?.length) setPartialPages(pagesData.pages)
          } catch {}
        }
      } catch {
        // Keep polling silently
      }
    }, POLLING_INTERVAL_MS)
  }, [bookId, loadPreviewPages])

  useEffect(() => {
    let cancelled = false

    const init = async () => {
      try {
        const { data: bookData } = await bookService.getBook(bookId)
        if (cancelled) return

        const fetchedBook = bookData.book
        setBook(fetchedBook)
        setStatus(fetchedBook.status)
        setCoverPageIndex(fetchedBook.coverPageIndex || 0)

        if (fetchedBook.status === 'ready') {
          await loadPreviewPages()
        } else if (fetchedBook.status === 'failed') {
          setFailureReason(fetchedBook.failureReason || null)
        } else {
          // Trigger generation only for fresh draft books
          if (fetchedBook.status === 'draft') {
            try {
              await bookService.generateStory(bookId)
              setStatus('generating_story')
            } catch (err) {
              if (err.response?.status !== 409) {
                toast.error('Could not start generation — please retry.')
              }
            }
          }
          if (!cancelled) startPolling()
        }
      } catch {
        if (!cancelled) {
          toast.error('Book not found.')
          navigate('/dashboard')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    init()
    return () => {
      cancelled = true
      clearInterval(intervalRef.current)
    }
  }, [bookId])

  const handleRetry = async () => {
    setRetrying(true)
    setFailureReason(null)
    try {
      if (status === 'generating_images') {
        await bookService.generateImages(bookId)
        setPercentage(0)
      } else {
        await bookService.generateStory(bookId)
        setStatus('generating_story')
        setPercentage(0)
      }
      startPolling()
      toast.success('Restarting generation…')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not retry — please try again.')
    } finally {
      setRetrying(false)
    }
  }

  const handleSetCover = async (pageIndex) => {
    try {
      await bookService.setCover(bookId, pageIndex)
      setCoverPageIndex(pageIndex)
      toast.success('Cover updated!')
    } catch {
      toast.error('Could not update cover')
    }
  }

  const handleBuy = () => navigate(`/checkout/${bookId}`)

  const handleDownload = async () => {
    try {
      const { data } = await bookService.downloadPdf(bookId)
      if (data.downloadUrl) {
        window.open(data.downloadUrl, '_blank')
      } else {
        toast.error('PDF URL not available yet.')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not get PDF download link.')
    }
  }

  const handleRegenerateImages = async () => {
    try {
      await bookService.generateImages(bookId)
      setStatus('generating_images')
      setPercentage(0)
      startPolling()
      toast.success('Regenerating images…')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not regenerate images.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}>
          <BookOpen className="w-10 h-10 text-gold" />
        </motion.div>
      </div>
    )
  }

  if (status === 'failed') {
    return <FailedView reason={failureReason} onRetry={handleRetry} retrying={retrying} />
  }

  if (status === 'ready' && pages.length > 0) {
    return <ReadyView book={book} pages={pages} onBuy={handleBuy} onDownload={handleDownload} onRegenerateImages={handleRegenerateImages} onSetCover={handleSetCover} coverPageIndex={coverPageIndex} />
  }

  return (
    <GeneratingView
      status={status}
      percentage={percentage}
      progress={progressDetails}
      bookTitle={book?.title}
      onRetry={handleRetry}
      retrying={retrying}
      partialPages={partialPages}
    />
  )
}
