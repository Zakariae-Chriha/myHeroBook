import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Mic, Shield, LogOut, Save, ChevronLeft,
  CheckCircle, AlertCircle, Loader2, Upload, Trash2,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { authService } from '../services/authService.js'
import api from '../services/api.js'
import { LANGUAGES } from '../utils/constants.js'
import toast from 'react-hot-toast'

// ── Section wrapper ────────────────────────────────────────────────────────────

function Section({ icon: Icon, title, children }) {
  return (
    <div className="card border border-white/8 p-6">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center">
          <Icon className="w-4 h-4 text-gold" />
        </div>
        <h2 className="text-white font-heading font-semibold text-base">{title}</h2>
      </div>
      {children}
    </div>
  )
}

// ── Field ──────────────────────────────────────────────────────────────────────

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-muted text-xs font-medium uppercase tracking-wider">{label}</label>
      {children}
    </div>
  )
}

// ── Voice section ──────────────────────────────────────────────────────────────

function VoiceSection() {
  const [status, setStatus] = useState(null)
  const [loadingStatus, setLoadingStatus] = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => {
    api.get('/voice/status')
      .then(({ data }) => setStatus(data))
      .catch(() => setStatus({ hasVoice: false }))
      .finally(() => setLoadingStatus(false))
  }, [])

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('voiceSample', file)

    setUploading(true)
    try {
      const { data } = await api.post('/voice/upload-sample', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setStatus({ hasVoice: true, voiceId: data.voiceId, sampleUrl: null })
      toast.success('Voice cloned! Future books will narrate in your voice.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed — please try again.')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  if (loadingStatus) {
    return <div className="h-10 bg-bg-secondary rounded-xl animate-pulse" />
  }

  if (status?.hasVoice) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-success/8 border border-success/20">
          <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
          <div>
            <p className="text-white text-sm font-medium">Voice cloned</p>
            <p className="text-muted text-xs mt-0.5">
              Your voice is saved and will narrate all Magic Voice Books.
            </p>
          </div>
        </div>
        <p className="text-muted text-xs">
          Want to re-record? Upload a new sample below — it will replace your current voice.
        </p>
        <label className="btn-secondary flex items-center justify-center gap-2 py-2.5 text-sm cursor-pointer">
          <Upload className="w-4 h-4" />
          Replace voice sample
          <input
            ref={fileRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleFileUpload}
            disabled={uploading}
          />
        </label>
        {uploading && (
          <p className="text-muted text-xs text-center flex items-center justify-center gap-1.5">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Cloning your voice…
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-4 rounded-xl bg-bg-secondary border border-white/8">
        <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-white text-sm font-medium">No voice cloned yet</p>
          <p className="text-muted text-xs mt-0.5 leading-relaxed">
            Upload a 30–180 second audio clip. Your AI-cloned voice will narrate every page of
            your Magic Voice Books.
          </p>
        </div>
      </div>

      <label className={`btn-primary flex items-center justify-center gap-2 py-3 cursor-pointer ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
        {uploading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Cloning your voice…
          </>
        ) : (
          <>
            <Mic className="w-4 h-4" />
            Upload voice sample
          </>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={handleFileUpload}
          disabled={uploading}
        />
      </label>

      <p className="text-muted text-xs text-center">
        MP3, WAV, WEBM or OGG · Required for Magic Voice Book tier
      </p>
    </div>
  )
}

// ── Subscription badge ─────────────────────────────────────────────────────────

function SubscriptionBadge({ subscription }) {
  const plan = subscription?.plan || 'free'
  const isActive = subscription?.status === 'active'

  const styles = {
    free:    'text-muted bg-muted/10 border-muted/20',
    monthly: 'text-gold bg-gold/10 border-gold/20',
    yearly:  'text-gold bg-gold/10 border-gold/20',
  }

  return (
    <div className="flex items-center gap-3">
      <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border capitalize ${styles[plan] || styles.free}`}>
        {plan === 'free' ? 'Free plan' : `${plan.charAt(0).toUpperCase() + plan.slice(1)} plan${isActive ? ' · Active' : ''}`}
      </span>
      {subscription?.currentPeriodEnd && isActive && (
        <span className="text-muted text-xs">
          Renews {new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(subscription.currentPeriodEnd))}
        </span>
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function Account() {
  const { user, updateUser, logout } = useAuth()
  const navigate = useNavigate()

  const [firstName, setFirstName] = useState(user?.firstName || '')
  const [lastName, setLastName]   = useState(user?.lastName  || '')
  const [language, setLanguage]   = useState(user?.language  || 'en')
  const [saving, setSaving]       = useState(false)
  const [dirty, setDirty]         = useState(false)

  // Track dirty state
  useEffect(() => {
    setDirty(
      firstName !== (user?.firstName || '') ||
      lastName  !== (user?.lastName  || '') ||
      language  !== (user?.language  || 'en')
    )
  }, [firstName, lastName, language, user])

  const handleSave = async (e) => {
    e.preventDefault()
    if (!dirty) return
    if (!firstName.trim() || !lastName.trim()) {
      toast.error('First and last name are required.')
      return
    }
    setSaving(true)
    try {
      const { data } = await authService.updateProfile({
        firstName: firstName.trim(),
        lastName:  lastName.trim(),
        language,
      })
      updateUser(data.user)
      setDirty(false)
      toast.success('Profile updated.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save — please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Sticky nav */}
      <nav className="sticky top-0 z-30 bg-bg-primary/95 backdrop-blur border-b border-white/8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 text-muted hover:text-white transition-colors text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            Dashboard
          </Link>
          <span className="font-heading font-bold text-gold text-base">My Account</span>
          <div className="w-20" /> {/* spacer */}
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Profile */}
        <Section icon={User} title="Profile">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="First name">
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="input"
                  placeholder="First name"
                  maxLength={50}
                />
              </Field>
              <Field label="Last name">
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="input"
                  placeholder="Last name"
                  maxLength={50}
                />
              </Field>
            </div>

            <Field label="Email">
              <input
                value={user?.email || ''}
                disabled
                className="input opacity-50 cursor-not-allowed"
              />
            </Field>

            <Field label="Default language">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="input"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label} ({l.native})
                  </option>
                ))}
              </select>
            </Field>

            <AnimatePresence>
              {dirty && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                >
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary flex items-center gap-2 py-2.5 px-6 disabled:opacity-60"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Save changes
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </Section>

        {/* Subscription */}
        <Section icon={Shield} title="Subscription">
          <div className="space-y-4">
            <SubscriptionBadge subscription={user?.subscription} />
            <p className="text-muted text-xs leading-relaxed">
              Each book purchase includes lifetime access to your personalised PDF in the dashboard.
              Printed books and voice narration are billed per order.
            </p>
          </div>
        </Section>

        {/* Voice */}
        <Section icon={Mic} title="Parent Voice">
          <VoiceSection />
        </Section>

        {/* Security */}
        <Section icon={Shield} title="Security">
          <div className="space-y-3">
            <p className="text-muted text-sm">
              To change your password, use the reset flow — we'll email you a secure link.
            </p>
            <Link
              to="/forgot-password"
              className="btn-secondary inline-flex items-center gap-2 text-sm py-2.5 px-5"
            >
              Change password
            </Link>
          </div>
        </Section>

        {/* Danger zone */}
        <div className="pt-2 pb-8 border-t border-white/8">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-error text-sm hover:text-red-300 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>

      </div>
    </div>
  )
}
