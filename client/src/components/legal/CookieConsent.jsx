import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, X, ChevronDown, ChevronUp } from 'lucide-react'

const STORAGE_KEY = 'hksl_cookie_consent'

function getConsent() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) } catch { return null }
}

function saveConsent(value) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...value, date: new Date().toISOString() }))
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [prefs, setPrefs] = useState({ analytics: false, marketing: false })

  useEffect(() => {
    if (!getConsent()) setTimeout(() => setVisible(true), 1200)
  }, [])

  const acceptAll = () => {
    saveConsent({ necessary: true, analytics: true, marketing: true, all: true })
    setVisible(false)
  }

  const rejectAll = () => {
    saveConsent({ necessary: true, analytics: false, marketing: false, all: false })
    setVisible(false)
  }

  const savePrefs = () => {
    saveConsent({ necessary: true, ...prefs, all: false })
    setVisible(false)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          className="fixed bottom-0 left-0 right-0 z-[9999] p-4 sm:p-6"
        >
          <div className="max-w-3xl mx-auto bg-bg-secondary border border-gold/30 rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-start gap-4 p-5 pb-0">
              <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Shield className="w-5 h-5 text-gold" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold text-base">We value your privacy 🍪</h3>
                <p className="text-muted text-sm mt-1 leading-relaxed">
                  We use cookies to make Hero Kids StoryLab work and to improve your experience.
                  Essential cookies are always active.{' '}
                  <a href="/privacy" className="text-gold underline hover:text-gold/80">Privacy Policy</a>
                </p>
              </div>
              <button
                onClick={rejectAll}
                className="text-muted hover:text-white transition-colors flex-shrink-0 p-1"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Expandable preferences */}
            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pt-4 space-y-3">
                    {/* Necessary */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-bg-primary border border-white/5">
                      <div>
                        <p className="text-cream text-sm font-medium">Essential cookies</p>
                        <p className="text-muted text-xs">Login, security, book generation — always active</p>
                      </div>
                      <div className="w-10 h-5 bg-gold rounded-full flex items-center justify-end px-1 opacity-60 cursor-not-allowed">
                        <div className="w-3 h-3 bg-bg-primary rounded-full" />
                      </div>
                    </div>
                    {/* Analytics */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-bg-primary border border-white/5">
                      <div>
                        <p className="text-cream text-sm font-medium">Analytics cookies</p>
                        <p className="text-muted text-xs">Help us understand how you use the app</p>
                      </div>
                      <button
                        onClick={() => setPrefs(p => ({ ...p, analytics: !p.analytics }))}
                        className={`w-10 h-5 rounded-full flex items-center px-1 transition-colors ${prefs.analytics ? 'bg-gold justify-end' : 'bg-white/10 justify-start'}`}
                      >
                        <div className="w-3 h-3 bg-white rounded-full transition-all" />
                      </button>
                    </div>
                    {/* Marketing */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-bg-primary border border-white/5">
                      <div>
                        <p className="text-cream text-sm font-medium">Marketing cookies</p>
                        <p className="text-muted text-xs">Personalized recommendations and offers</p>
                      </div>
                      <button
                        onClick={() => setPrefs(p => ({ ...p, marketing: !p.marketing }))}
                        className={`w-10 h-5 rounded-full flex items-center px-1 transition-colors ${prefs.marketing ? 'bg-gold justify-end' : 'bg-white/10 justify-start'}`}
                      >
                        <div className="w-3 h-3 bg-white rounded-full transition-all" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2 p-5 pt-4">
              <button
                onClick={() => setExpanded(v => !v)}
                className="flex items-center gap-1.5 text-muted text-sm hover:text-white transition-colors"
              >
                {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                {expanded ? 'Hide settings' : 'Manage preferences'}
              </button>
              <div className="flex-1" />
              {expanded ? (
                <button onClick={savePrefs} className="btn-secondary text-sm px-4 py-2">
                  Save preferences
                </button>
              ) : (
                <button onClick={rejectAll} className="btn-secondary text-sm px-4 py-2">
                  Reject all
                </button>
              )}
              <button onClick={acceptAll} className="btn-primary text-sm px-5 py-2">
                Accept all
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function useCookieConsent() {
  return {
    hasConsent: () => Boolean(getConsent()),
    getPrefs: () => getConsent() || { necessary: true, analytics: false, marketing: false },
    reset: () => { localStorage.removeItem(STORAGE_KEY); window.location.reload() },
  }
}
