import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, Play, Pause, RotateCcw, Upload, CheckCircle, Loader2, AlertCircle } from 'lucide-react'
import { useVoice } from '../../hooks/useVoice.js'
import { MIN_VOICE_RECORDING_SECONDS, MAX_VOICE_RECORDING_SECONDS } from '../../utils/constants.js'

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

// Animated waveform bars while recording
function Waveform({ active }) {
  return (
    <div className="flex items-center gap-0.5 h-8">
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="w-1 rounded-full bg-gold"
          animate={active ? {
            height: [4, Math.random() * 24 + 8, 4],
          } : { height: 4 }}
          transition={active ? {
            duration: 0.4 + Math.random() * 0.4,
            repeat: Infinity,
            delay: i * 0.04,
            ease: 'easeInOut',
          } : { duration: 0.2 }}
        />
      ))}
    </div>
  )
}

export default function VoiceRecorder({ onVoiceReady }) {
  const {
    isRecording,
    audioUrl,
    duration,
    uploading,
    voiceId,
    error,
    startRecording,
    stopRecording,
    uploadVoice,
    reset,
  } = useVoice()

  const isTooShort = duration > 0 && duration < MIN_VOICE_RECORDING_SECONDS
  const isLongEnough = duration >= MIN_VOICE_RECORDING_SECONDS
  const hitMax = duration >= MAX_VOICE_RECORDING_SECONDS

  // Auto-stop at max
  useEffect(() => {
    if (hitMax && isRecording) stopRecording()
  }, [hitMax, isRecording, stopRecording])

  const handleUpload = async () => {
    const id = await uploadVoice()
    if (id && onVoiceReady) onVoiceReady(id)
  }

  if (voiceId) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4 py-6"
      >
        <div className="w-16 h-16 rounded-full bg-success/20 border-2 border-success flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-success" />
        </div>
        <div className="text-center">
          <p className="text-white font-semibold text-lg">Your voice is ready! 🎉</p>
          <p className="text-muted text-sm mt-1">
            All 32 pages will be narrated in your voice. The book will sound like you're there reading it.
          </p>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Recorder card */}
      <div className="card p-6 border border-white/10">
        {/* Duration + waveform */}
        <div className="flex flex-col items-center gap-4 mb-6">
          <div className="text-4xl font-heading font-bold text-white tabular-nums">
            {formatDuration(duration)}
          </div>
          <Waveform active={isRecording} />
          {/* Progress bar toward minimum */}
          <div className="w-full max-w-xs">
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${isLongEnough ? 'bg-success' : 'bg-gold'}`}
                animate={{ width: `${Math.min((duration / MIN_VOICE_RECORDING_SECONDS) * 100, 100)}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className="text-muted text-xs text-center mt-1.5">
              {isLongEnough
                ? '✓ Minimum length reached'
                : `Record at least ${MIN_VOICE_RECORDING_SECONDS - duration}s more`}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          {!isRecording && !audioUrl && (
            <motion.button
              type="button"
              onClick={startRecording}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-3 bg-error hover:bg-error/80 text-white font-semibold px-8 py-3.5 rounded-xl transition-colors shadow-lg"
            >
              <Mic className="w-5 h-5" />
              Start Recording
            </motion.button>
          )}

          {isRecording && (
            <motion.button
              type="button"
              onClick={stopRecording}
              whileTap={{ scale: 0.95 }}
              animate={{ boxShadow: ['0 0 0 0 rgba(232,84,84,0.4)', '0 0 0 12px rgba(232,84,84,0)', '0 0 0 0 rgba(232,84,84,0)'] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              className="flex items-center gap-3 bg-error text-white font-semibold px-8 py-3.5 rounded-xl"
            >
              <MicOff className="w-5 h-5" />
              Stop Recording
            </motion.button>
          )}

          {audioUrl && !isRecording && (
            <div className="flex items-center gap-3">
              <audio src={audioUrl} controls className="hidden" id="voice-preview" />
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('voice-preview')
                  el.paused ? el.play() : el.pause()
                }}
                className="btn-secondary flex items-center gap-2 px-5 py-2.5"
              >
                <Play className="w-4 h-4" />
                Preview
              </button>
              <button
                type="button"
                onClick={reset}
                className="btn-secondary flex items-center gap-2 px-5 py-2.5"
              >
                <RotateCcw className="w-4 h-4" />
                Re-record
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Upload button */}
      <AnimatePresence>
        {audioUrl && isLongEnough && !voiceId && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              onClick={handleUpload}
              disabled={uploading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-4"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Cloning your voice… this takes about 30 seconds
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Clone My Voice — Create the Magic
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Too short warning */}
      <AnimatePresence>
        {isTooShort && !isRecording && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-yellow-400 text-sm flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4" />
            Recording is too short. You need at least {MIN_VOICE_RECORDING_SECONDS} seconds for a quality voice clone.
          </motion.p>
        )}
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-error text-sm flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Script suggestion */}
      {!audioUrl && (
        <div className="bg-bg-secondary rounded-xl p-4 border border-white/5">
          <p className="text-cream text-xs font-medium mb-2">💡 What to say — just read this naturally:</p>
          <p className="text-muted text-sm italic leading-relaxed">
            "Once upon a time, in a land filled with wonder and magic, there lived a brave little hero named {'{your child\'s name}'}. Every single day, they woke up ready for a new adventure — ready to explore, to help, to discover. The world was their story, and they were the hero of every page."
          </p>
        </div>
      )}
    </div>
  )
}
