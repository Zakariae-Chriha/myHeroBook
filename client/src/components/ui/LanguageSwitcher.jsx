import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

const LANGS = [
  { code: 'en', label: 'English',  flag: '🇬🇧' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch',  flag: '🇩🇪' },
  { code: 'ar', label: 'عربي',    flag: '🇸🇦' },
]

export default function LanguageSwitcher({ mobile = false }) {
  const { i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const current = LANGS.find((l) => l.code === i18n.language) || LANGS[0]

  const change = (code) => {
    i18n.changeLanguage(code)
    setOpen(false)
  }

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (mobile) {
    return (
      <div className="space-y-1 pt-1 border-t border-white/5">
        {LANGS.map((l) => (
          <button
            key={l.code}
            onClick={() => change(l.code)}
            className={`w-full flex items-center gap-3 py-2.5 text-sm transition-colors ${
              l.code === current.code ? 'text-gold font-medium' : 'text-muted hover:text-white'
            }`}
          >
            <span>{l.flag}</span>
            <span>{l.label}</span>
            {l.code === current.code && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-gold" />}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-muted hover:text-white text-sm transition-colors py-1 px-2 rounded-lg hover:bg-white/5"
        aria-label="Change language"
      >
        <span className="text-base leading-none">{current.flag}</span>
        <span className="hidden sm:inline font-medium">{current.label}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-2 right-0 w-36 card py-1.5 shadow-xl border border-white/10 z-50"
          >
            {LANGS.map((l) => (
              <button
                key={l.code}
                onClick={() => change(l.code)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-white/5 ${
                  l.code === current.code ? 'text-gold font-medium' : 'text-cream hover:text-white'
                }`}
              >
                <span>{l.flag}</span>
                <span>{l.label}</span>
                {l.code === current.code && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-gold flex-shrink-0" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
