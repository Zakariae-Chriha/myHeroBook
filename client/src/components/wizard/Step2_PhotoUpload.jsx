import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, ArrowRight, ArrowLeft, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { useBook } from '../../context/BookContext.jsx'
import { childService } from '../../services/bookService.js'
import { ART_STYLES } from '../../utils/constants.js'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'

const MAX_MB = 10

function Sparkle({ style }) {
  return (
    <motion.div
      className="absolute w-2 h-2 bg-gold rounded-full pointer-events-none"
      style={style}
      initial={{ scale: 0, opacity: 1 }}
      animate={{ scale: [0, 1.5, 0], opacity: [1, 0.8, 0], y: [0, -40], x: [0, (Math.random() - 0.5) * 60] }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    />
  )
}

export default function Step2_PhotoUpload({ onBack }) {
  const { wizard, setField, nextStep } = useBook()
  const { t } = useTranslation('wizard')

  const [preview, setPreview] = useState(wizard.photoPreviewUrl || null)
  const [file, setFile] = useState(wizard.photoFile || null)
  const [artStyle, setArtStyle] = useState(wizard.artStyle || 'watercolor')
  const [sparkles, setSparkles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  const triggerSparkles = () => {
    const newSparkles = Array.from({ length: 12 }, (_, i) => ({
      id: Date.now() + i,
      style: {
        left: `${30 + Math.random() * 40}%`,
        top: `${20 + Math.random() * 60}%`,
      },
    }))
    setSparkles(newSparkles)
    setTimeout(() => setSparkles([]), 900)
  }

  const onDrop = useCallback((accepted, rejected) => {
    setError(null)
    if (rejected.length > 0) {
      const err = rejected[0].errors[0]
      if (err.code === 'file-too-large') setError(`Photo must be smaller than ${MAX_MB}MB.`)
      else if (err.code === 'file-invalid-type') setError('Only JPG, PNG, and WEBP images are accepted.')
      else setError(err.message)
      return
    }
    if (accepted.length > 0) {
      const f = accepted[0]
      setFile(f)
      const url = URL.createObjectURL(f)
      setPreview(url)
      setField('photoFile', f)
      setField('photoPreviewUrl', url)
      triggerSparkles()
    }
  }, [setField])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] },
    maxSize: MAX_MB * 1024 * 1024,
    maxFiles: 1,
    multiple: false,
  })

  const clearPhoto = () => {
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
    setFile(null)
    setField('photoFile', null)
    setField('photoPreviewUrl', null)
    setField('childId', null)
    setError(null)
  }

  const handleNext = async () => {
    if (!file && !wizard.uploadedPhotoUrl) {
      setError('Please upload a photo of your child to continue.')
      return
    }

    setUploading(true)
    setError(null)

    try {
      // Create child profile with Step 1 info
      let childId = wizard.childId
      if (!childId) {
        const { data: createData } = await childService.createChild({
          name: wizard.childName,
          age: wizard.childAge,
          gender: wizard.childGender,
          language: wizard.language,
          culture: wizard.culture || undefined,
          bestFriendName: wizard.bestFriendName || undefined,
          petName: wizard.petName || undefined,
          favoriteColor: wizard.favoriteColor,
          favoriteFood: wizard.favoriteFood || undefined,
          hometown: wizard.hometown || undefined,
          photoUrl: '',
        })
        childId = createData.child._id
        setField('childId', childId)
      }

      // Upload photo if we have a new file
      if (file) {
        const form = new FormData()
        form.append('photo', file)
        const { data: uploadData } = await childService.uploadPhoto(childId, form)
        setField('uploadedPhotoUrl', uploadData.photoUrl)
      }

      setField('artStyle', artStyle)
      nextStep()
    } catch (err) {
      const msg = err.response?.data?.message || 'Upload failed. Please try again.'
      setError(msg)
      toast.error(msg)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-3xl font-heading font-bold text-white mb-2">
            {t('step2.title')} <span className="gold-text">{t('step2.titleHighlight')}</span>
          </h2>
          <p className="text-muted">{t('step2.subtitle')}</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left — dropzone */}
        <div className="space-y-5">
          <div className="relative">
            {/* Sparkle burst */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-20">
              <AnimatePresence>
                {sparkles.map((s) => <Sparkle key={s.id} style={s.style} />)}
              </AnimatePresence>
            </div>

            <AnimatePresence mode="wait">
              {preview ? (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="relative rounded-2xl overflow-hidden border-2 border-gold shadow-gold-glow aspect-square"
                >
                  <img
                    src={preview}
                    alt="Child preview"
                    className="w-full h-full object-cover"
                  />
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white text-sm">
                      <CheckCircle className="w-4 h-4 text-success" />
                      Photo uploaded!
                    </div>
                    <button
                      type="button"
                      onClick={clearPhoto}
                      className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-error/80 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="dropzone"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  {...getRootProps()}
                  className={`aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-200 ${
                    isDragActive
                      ? 'border-gold bg-gold/10 shadow-gold-glow'
                      : 'border-white/20 hover:border-gold/50 hover:bg-gold/5'
                  }`}
                >
                  <input {...getInputProps()} />
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${isDragActive ? 'bg-gold/20' : 'bg-bg-secondary'}`}>
                    <Upload className={`w-8 h-8 ${isDragActive ? 'text-gold' : 'text-muted'}`} />
                  </div>
                  <div className="text-center px-6">
                    <p className="text-white font-medium mb-1">
                      {isDragActive ? 'Drop it here!' : 'Drag & drop a photo'}
                    </p>
                    <p className="text-muted text-sm">or click to browse</p>
                    <p className="text-muted/60 text-xs mt-2">JPG · PNG · WEBP · Max {MAX_MB}MB</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-start gap-2 text-error text-sm bg-error/10 border border-error/20 rounded-xl p-3"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tips */}
          <div className="bg-bg-secondary rounded-xl p-4 space-y-2">
            <p className="text-cream text-xs font-medium mb-2">📸 Tips for best results:</p>
            {[
              'Face fills at least 30% of the photo',
              'Good lighting — no heavy shadows',
              'Eyes open, facing the camera',
              'No sunglasses or hats covering the face',
            ].map((tip) => (
              <p key={tip} className="text-muted text-xs flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-gold flex-shrink-0" />
                {tip}
              </p>
            ))}
          </div>
        </div>

        {/* Right — art style selection */}
        <div className="space-y-5">
          <div>
            <h3 className="text-white font-semibold mb-1">Choose your art style</h3>
            <p className="text-muted text-sm">Every page of the book will be illustrated in this style.</p>
          </div>

          <div className="space-y-3">
            {ART_STYLES.map((style) => (
              <motion.button
                key={style.id}
                type="button"
                onClick={() => setArtStyle(style.id)}
                whileTap={{ scale: 0.98 }}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left cursor-pointer ${
                  artStyle === style.id
                    ? 'border-gold bg-gold/10 shadow-gold-glow'
                    : 'border-white/10 hover:border-white/25 bg-bg-secondary'
                }`}
              >
                {/* Style preview swatch */}
                <div className={`w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center text-2xl ${
                  style.id === 'watercolor' ? 'bg-gradient-to-br from-blue-400/30 to-purple-400/30' :
                  style.id === 'comic' ? 'bg-gradient-to-br from-yellow-400/30 to-red-400/30' :
                  'bg-gradient-to-br from-amber-400/30 to-orange-400/30'
                }`}>
                  {style.id === 'watercolor' ? '🎨' : style.id === 'comic' ? '💥' : '📖'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`font-semibold ${artStyle === style.id ? 'text-gold' : 'text-white'}`}>
                      {style.label}
                    </p>
                    {artStyle === style.id && (
                      <CheckCircle className="w-5 h-5 text-gold flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-muted text-sm">{style.description}</p>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Consistency note */}
          <div className="bg-gold/5 border border-gold/15 rounded-xl p-4">
            <p className="text-gold text-xs font-medium mb-1">✨ Face Consistency Technology</p>
            <p className="text-muted text-xs leading-relaxed">
              We use IP-Adapter AI to maintain your child's exact facial features — eye colour, face shape, hair — consistently across all 32 illustrated pages.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-10 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="btn-secondary flex items-center gap-2 px-6 py-3"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('nav.back')}
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={uploading || (!preview && !wizard.uploadedPhotoUrl)}
          className="btn-primary flex items-center gap-2 px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Uploading…
            </>
          ) : (
            <>
              {t('nav.next')}
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
