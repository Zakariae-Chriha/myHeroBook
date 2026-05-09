import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext.jsx'
import { BookOpen, Menu, X, User, LogOut, LayoutDashboard, ShieldCheck } from 'lucide-react'
import LanguageSwitcher from '../ui/LanguageSwitcher.jsx'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { t } = useTranslation('common')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const navLinks = [
    { label: t('nav.howItWorks'), href: '/#how-it-works' },
    { label: t('nav.pricing'),    href: '/#pricing' },
    { label: t('nav.gallery'),    href: '/#gallery' },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-bg-primary/90 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-gold-gradient rounded-lg flex items-center justify-center shadow-gold-glow group-hover:shadow-gold-glow-lg transition-shadow">
              <BookOpen className="w-5 h-5 text-bg-primary" />
            </div>
            <span className="font-heading font-bold text-lg text-white hidden sm:block">
              Hero Kids <span className="text-gold">StoryLab</span>
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-muted hover:text-white text-sm font-medium transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Language switcher (desktop) */}
            <div className="hidden md:block">
              <LanguageSwitcher />
            </div>

            {user ? (
              <>
                <Link
                  to="/create"
                  className="hidden sm:flex btn-primary text-sm py-2 px-4"
                >
                  {t('nav.createBook')}
                </Link>

                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen((o) => !o)}
                    className="w-9 h-9 rounded-full bg-bg-secondary border border-gold/30 flex items-center justify-center text-gold hover:border-gold transition-colors"
                  >
                    <User className="w-4 h-4" />
                  </button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        className="absolute right-0 mt-2 w-48 card py-2 shadow-xl"
                      >
                        <div className="px-4 py-2 border-b border-white/5">
                          <p className="text-sm text-white font-medium truncate">{user.firstName}</p>
                          <p className="text-xs text-muted truncate">{user.email}</p>
                        </div>
                        <Link
                          to="/dashboard"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-cream hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4" /> {t('nav.dashboard')}
                        </Link>
                        <Link
                          to="/account"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-cream hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <User className="w-4 h-4" /> {t('nav.account')}
                        </Link>
                        {user.isAdmin && (
                          <Link
                            to="/admin"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gold hover:text-white hover:bg-white/5 transition-colors"
                          >
                            <ShieldCheck className="w-4 h-4" /> {t('nav.adminPanel')}
                          </Link>
                        )}
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-error hover:bg-white/5 transition-colors"
                        >
                          <LogOut className="w-4 h-4" /> {t('nav.signOut')}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm text-muted hover:text-white transition-colors hidden sm:block"
                >
                  {t('nav.signIn')}
                </Link>
                <Link to="/register" className="btn-primary text-sm py-2 px-4">
                  {t('nav.getStarted')}
                </Link>
              </>
            )}

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 -mr-2 text-muted hover:text-white"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-white/5 bg-bg-primary"
          >
            <div className="px-4 py-3 space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block text-muted hover:text-white text-sm py-2.5 border-b border-white/5"
                >
                  {link.label}
                </a>
              ))}

              {user ? (
                <>
                  <Link
                    to="/create"
                    onClick={() => setMobileOpen(false)}
                    className="block text-gold font-medium text-sm py-2.5 border-b border-white/5"
                  >
                    ✨ {t('nav.createBook')}
                  </Link>
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 text-cream hover:text-white text-sm py-2.5 border-b border-white/5"
                  >
                    <LayoutDashboard className="w-4 h-4" /> {t('nav.dashboard')}
                  </Link>
                  <Link
                    to="/account"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 text-cream hover:text-white text-sm py-2.5 border-b border-white/5"
                  >
                    <User className="w-4 h-4" /> {t('nav.account')}
                  </Link>
                  {user.isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 text-gold text-sm py-2.5 border-b border-white/5"
                    >
                      <ShieldCheck className="w-4 h-4" /> {t('nav.adminPanel')}
                    </Link>
                  )}
                  <button
                    onClick={() => { setMobileOpen(false); handleLogout() }}
                    className="w-full flex items-center gap-2 text-error text-sm py-2.5 border-b border-white/5"
                  >
                    <LogOut className="w-4 h-4" /> {t('nav.signOut')}
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block text-muted hover:text-white text-sm py-2.5 border-b border-white/5"
                >
                  {t('nav.signIn')}
                </Link>
              )}

              {/* Language switcher in mobile menu */}
              <LanguageSwitcher mobile />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
