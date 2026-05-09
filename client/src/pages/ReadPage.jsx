import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, ChevronLeft, ChevronRight, BookOpen, Volume2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import api from '../services/api.js'

function TapToHear() {
  const { t } = useTranslation('common')
  return <p className="text-muted text-xs text-center mt-3">{t('read.tapToHear')}</p>
}

// ── Audio player ───────────────────────────────────────────────────────────────

function AudioPlayer({ audioUrl, autoPlay }) {
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [loading, setLoading] = useState(true)

  const fmt = (s) => {
    if (!s || isNaN(s)) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return
    if (playing) {
      audioRef.current.pause()
    } else {
      audioRef.current.play().catch(() => {})
    }
  }, [playing])

  const handleSeek = (e) => {
    if (!audioRef.current || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    audioRef.current.currentTime = pct * duration
  }

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onEnded = () => { setPlaying(false); setProgress(100) }
    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
      if (audio.duration) setProgress((audio.currentTime / audio.duration) * 100)
    }
    const onLoaded = () => { setDuration(audio.duration); setLoading(false) }
    const onCanPlay = () => setLoading(false)

    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('loadedmetadata', onLoaded)
    audio.addEventListener('canplay', onCanPlay)

    return () => {
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('loadedmetadata', onLoaded)
      audio.removeEventListener('canplay', onCanPlay)
    }
  }, [])

  return (
    <div className="bg-bg-secondary rounded-2xl p-5 border border-gold/20">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      <div className="flex items-center gap-4">
        {/* Play / Pause */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={togglePlay}
          disabled={loading}
          className="w-14 h-14 rounded-full bg-gold-gradient flex items-center justify-center flex-shrink-0 shadow-gold-glow disabled:opacity-50"
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? (
            <Pause className="w-6 h-6 text-bg-primary" />
          ) : (
            <Play className="w-6 h-6 text-bg-primary ml-0.5" />
          )}
        </motion.button>

        <div className="flex-1 min-w-0">
          {/* Progress bar */}
          <div
            role="progressbar"
            aria-valuenow={progress}
            onClick={handleSeek}
            className="h-2 bg-white/10 rounded-full cursor-pointer overflow-hidden mb-2"
          >
            <motion.div
              className="h-full bg-gold-gradient rounded-full"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>

          {/* Time display */}
          <div className="flex justify-between text-xs text-muted">
            <span>{fmt(currentTime)}</span>
            <span className="flex items-center gap-1">
              <Volume2 className="w-3 h-3" />
              {loading ? 'Loading…' : fmt(duration)}
            </span>
          </div>
        </div>
      </div>

      {!playing && !loading && (
        <TapToHear />
      )}
    </div>
  )
}

// ── Loading skeleton ───────────────────────────────────────────────────────────

function ReadSkeleton() {
  return (
    <div className="min-h-screen bg-bg-primary animate-pulse">
      <div className="aspect-square bg-bg-secondary w-full" />
      <div className="p-6 space-y-4">
        <div className="h-4 bg-bg-secondary rounded w-1/3" />
        <div className="h-4 bg-bg-secondary rounded w-full" />
        <div className="h-4 bg-bg-secondary rounded w-4/5" />
        <div className="h-20 bg-bg-secondary rounded-2xl" />
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function ReadPage() {
  const { bookId, pageNumber } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation('common')

  const [page, setPage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const currentPage = parseInt(pageNumber, 10)

  useEffect(() => {
    if (bookId && currentPage) {
      localStorage.setItem(`rprog-${bookId}`, currentPage)
    }
  }, [bookId, currentPage])

  const fetchPage = useCallback(async (num) => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get(`/books/${bookId}/read/${num}`)
      setPage(data)
    } catch (err) {
      const msg = err.response?.status === 202
        ? t('read.stillGenerating')
        : err.response?.data?.message || t('read.pageUnavailable')
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [bookId])

  useEffect(() => {
    fetchPage(currentPage)
  }, [currentPage, fetchPage])

  const goTo = (num) => navigate(`/read/${bookId}/${num}`, { replace: true })

  if (loading) return <ReadSkeleton />

  if (error) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <BookOpen className="w-12 h-12 text-muted mx-auto mb-4" />
          <p className="text-white font-semibold mb-2">{t('read.pageUnavailable')}</p>
          <p className="text-muted text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col max-w-lg mx-auto">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-gold text-xs font-medium uppercase tracking-widest truncate">
            {page.bookTitle}
          </p>
          {page.childName && (
            <p className="text-muted text-xs">
              {page.childName}'s Hero Universe
            </p>
          )}
        </div>
        <div className="text-muted text-sm flex-shrink-0 ml-3">
          {currentPage} / {page.totalPages}
        </div>
      </div>

      {/* Illustration */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.25 }}
          className="relative"
        >
          {page.imageUrl ? (
            <img
              src={page.imageUrl}
              alt={`Page ${currentPage}`}
              className="w-full aspect-square object-cover"
            />
          ) : (
            <div className="w-full aspect-square bg-bg-secondary flex items-center justify-center text-5xl">
              📖
            </div>
          )}

          {/* Page number badge */}
          <div className="absolute bottom-3 right-3 bg-bg-primary/80 backdrop-blur rounded-full px-3 py-1 text-xs text-cream">
            {currentPage}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Gold divider */}
      <div className="h-0.5 bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

      {/* Content */}
      <div className="flex-1 px-5 py-5 flex flex-col gap-5">
        {/* Story text */}
        <AnimatePresence mode="wait">
          <motion.p
            key={`text-${currentPage}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="text-cream text-base leading-relaxed font-medium"
          >
            {page.text}
          </motion.p>
        </AnimatePresence>

        {/* Audio player */}
        {page.hasAudio && page.audioUrl && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <AudioPlayer key={`audio-${currentPage}`} audioUrl={page.audioUrl} />
          </motion.div>
        )}

        {/* Page navigation */}
        <div className="flex items-center justify-between mt-auto pt-2" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={() => goTo(currentPage - 1)}
            disabled={!page.hasPrevPage}
            className="flex items-center gap-1.5 px-5 py-3 rounded-xl border border-white/10 text-cream text-sm disabled:opacity-25 disabled:cursor-not-allowed active:bg-white/5"
          >
            <ChevronLeft className="w-4 h-4" />
            {t('read.prev')}
          </motion.button>

          {/* Dot row (shows position) */}
          <div className="flex gap-1 overflow-hidden max-w-[120px]">
            {Array.from({ length: Math.min(page.totalPages, 9) }, (_, i) => {
              const idx = Math.max(0, Math.min(page.totalPages - 9, currentPage - 5))
              const pg = idx + i + 1
              return (
                <div
                  key={pg}
                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all ${
                    pg === currentPage ? 'bg-gold scale-125' : 'bg-white/20'
                  }`}
                />
              )
            })}
          </div>

          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={() => goTo(currentPage + 1)}
            disabled={!page.hasNextPage}
            className="flex items-center gap-1.5 px-5 py-3 rounded-xl border border-white/10 text-cream text-sm disabled:opacity-25 disabled:cursor-not-allowed active:bg-white/5"
          >
            {t('read.next')}
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </div>
  )
}
