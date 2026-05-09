import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, BookOpen, Loader2, Check } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'

const schema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50),
  email: z.string().email('Please enter a valid email'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128),
})

export default function Register() {
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation('common')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) })

  const password = watch('password', '')
  const passwordStrength = password.length >= 12 ? 3 : password.length >= 8 ? 2 : password.length >= 4 ? 1 : 0
  const strengthLabels = ['', t('auth.register.strengthWeak'), t('auth.register.strengthGood'), t('auth.register.strengthStrong')]
  const strengthColors = ['', 'bg-error', 'bg-yellow-500', 'bg-success']
  const benefits = t('auth.register.benefits', { returnObjects: true })

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await registerUser(data)
      toast.success('Welcome to Hero Kids StoryLab! 🎉')
      navigate('/create')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen pt-20 pb-12 flex items-center justify-center px-4">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

        {/* Left — benefits panel */}
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="hidden lg:block"
        >
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gold-gradient rounded-2xl shadow-gold-glow mb-6">
            <BookOpen className="w-7 h-7 text-bg-primary" />
          </div>
          <h1 className="text-4xl font-heading font-bold text-white leading-tight mb-4">
            {t('auth.register.createHero')}
          </h1>
          <p className="text-muted text-lg mb-8 leading-relaxed">
            {t('auth.register.joinFamilies')}
          </p>
          <ul className="space-y-4">
            {benefits.map((b) => (
              <li key={b} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-gold-gradient flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-bg-primary" />
                </div>
                <span className="text-cream text-sm">{b}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Right — form */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="text-center mb-6 lg:hidden">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gold-gradient rounded-xl shadow-gold-glow mb-3">
              <BookOpen className="w-6 h-6 text-bg-primary" />
            </div>
            <h1 className="text-2xl font-heading font-bold text-white">{t('auth.register.title')}</h1>
          </div>

          <div className="card p-8">
            <h2 className="text-xl font-heading font-semibold text-white mb-6 hidden lg:block">
              {t('auth.register.title')}
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              {/* Name row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">{t('auth.register.firstName')}</label>
                  <input
                    {...register('firstName')}
                    type="text"
                    autoComplete="given-name"
                    placeholder="Emma"
                    className="input-field"
                  />
                  {errors.firstName && (
                    <p className="text-error text-xs mt-1">{errors.firstName.message}</p>
                  )}
                </div>
                <div>
                  <label className="label">{t('auth.register.lastName')}</label>
                  <input
                    {...register('lastName')}
                    type="text"
                    autoComplete="family-name"
                    placeholder="Smith"
                    className="input-field"
                  />
                  {errors.lastName && (
                    <p className="text-error text-xs mt-1">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="label">{t('auth.register.email')}</label>
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="input-field"
                />
                {errors.email && (
                  <p className="text-error text-xs mt-1">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="label">{t('auth.register.password')}</label>
                <div className="relative">
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Min. 8 characters"
                    className="input-field pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* Strength indicator */}
                {password.length > 0 && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                            passwordStrength >= level ? strengthColors[passwordStrength] : 'bg-white/10'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted">{strengthLabels[passwordStrength]}</p>
                  </div>
                )}
                {errors.password && (
                  <p className="text-error text-xs mt-1">{errors.password.message}</p>
                )}
              </div>

              {/* Terms */}
              <p className="text-xs text-muted leading-relaxed">
                By creating an account you agree to our{' '}
                <a href="/#" className="text-gold hover:underline">Terms of Service</a>
                {' '}and{' '}
                <a href="/#" className="text-gold hover:underline">Privacy Policy</a>.
              </p>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('auth.register.submitting')}
                  </>
                ) : (
                  t('auth.register.submit')
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-muted text-sm mt-5">
            {t('auth.register.alreadyHave')}{' '}
            <Link to="/login" className="text-gold hover:text-gold-light font-medium transition-colors">
              {t('auth.register.signIn')}
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
