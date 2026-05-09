import { Link } from 'react-router-dom'
import { BookOpen } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-bg-primary border-t border-white/5 py-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gold-gradient rounded-lg flex items-center justify-center shadow-gold-glow">
                <BookOpen className="w-5 h-5 text-bg-primary" />
              </div>
              <span className="font-heading font-bold text-lg text-white">
                Hero Kids <span className="text-gold">StoryLab</span>
              </span>
            </div>
            <p className="text-muted text-sm leading-relaxed max-w-xs">
              The world's first AI children's book where YOUR child is the real illustrated hero.
              Real face. Real story. Real magic.
            </p>
            <div className="flex gap-4 mt-6">
              <span className="text-xs bg-bg-secondary border border-white/10 rounded-full px-3 py-1 text-muted">
                🔒 Secure Payments
              </span>
              <span className="text-xs bg-bg-secondary border border-white/10 rounded-full px-3 py-1 text-muted">
                🌍 Ships Worldwide
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Product</h4>
            <ul className="space-y-2">
              {['How It Works', 'Pricing', 'Sample Books', 'Book Series'].map((item) => (
                <li key={item}>
                  <a href="/#" className="text-muted hover:text-cream text-sm transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Support</h4>
            <ul className="space-y-2">
              {['FAQ', 'Contact Us', 'Privacy Policy', 'Terms of Service', 'Refund Policy'].map(
                (item) => (
                  <li key={item}>
                    <a href="/#" className="text-muted hover:text-cream text-sm transition-colors">
                      {item}
                    </a>
                  </li>
                )
              )}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 mt-10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-muted text-xs">
            © {new Date().getFullYear()} Hero Kids StoryLab. All rights reserved.
          </p>
          <p className="text-muted text-xs">
            Made with 💛 for children everywhere
          </p>
        </div>
      </div>
    </footer>
  )
}
