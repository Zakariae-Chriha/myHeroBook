import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowLeft, Shield } from 'lucide-react'
import { useCookieConsent } from '../components/legal/CookieConsent.jsx'

const COMPANY = 'The Hero Kids StoryLab'
const EMAIL = 'chrihazakaria@gmail.com'
const UPDATED = 'May 2025'

export default function Privacy() {
  const { reset } = useCookieConsent()

  return (
    <div className="min-h-screen bg-bg-primary pb-20">
      <div className="max-w-3xl mx-auto px-4 pt-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Link to="/" className="inline-flex items-center gap-2 text-muted hover:text-white text-sm mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center">
              <Shield className="w-6 h-6 text-gold" />
            </div>
            <div>
              <h1 className="text-3xl font-heading font-bold text-white">Privacy Policy</h1>
              <p className="text-muted text-sm">Last updated: {UPDATED}</p>
            </div>
          </div>
        </motion.div>

        <div className="space-y-8 text-cream/80 leading-relaxed">

          <section>
            <h2 className="text-xl font-heading font-semibold text-white mb-3">1. Who we are</h2>
            <p>
              {COMPANY} operates the Hero Kids StoryLab application, which creates AI-powered personalized children's books.
              Contact us at <a href={`mailto:${EMAIL}`} className="text-gold hover:underline">{EMAIL}</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-heading font-semibold text-white mb-3">2. Data we collect</h2>
            <div className="space-y-3">
              {[
                { title: 'Account data', desc: 'Name, email address, password (hashed — we never store plain text).' },
                { title: "Child profile data", desc: "Child's name, age, gender, and optional photo uploaded by you." },
                { title: 'Book content', desc: 'Stories, illustrations, and personalization details you provide during book creation.' },
                { title: 'Payment data', desc: 'Processed securely by Stripe — we never see or store full card numbers.' },
                { title: 'Usage data', desc: 'Pages visited, features used, error logs — to improve the service.' },
              ].map(({ title, desc }) => (
                <div key={title} className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-gold mt-2.5 flex-shrink-0" />
                  <p><span className="text-cream font-medium">{title}:</span> {desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-heading font-semibold text-white mb-3">3. Children's privacy (COPPA & GDPR)</h2>
            <p>
              This service is designed for parents/guardians. We do not directly collect data from children.
              Child photos and profile data are uploaded and controlled entirely by the parent or guardian.
              Child photos are used <strong className="text-cream">only</strong> to generate illustrations for the book
              and are stored securely on Cloudinary. You may delete your child's data at any time from your Account settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-heading font-semibold text-white mb-3">4. How we use your data</h2>
            <div className="space-y-2">
              {[
                'Providing and improving our personalized book generation service',
                'Processing your payments securely through Stripe',
                'Sending transactional emails (book ready, order confirmation)',
                'Detecting and preventing fraud or abuse',
                'Complying with legal obligations',
              ].map((item) => (
                <div key={item} className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-gold mt-2.5 flex-shrink-0" />
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-heading font-semibold text-white mb-3">5. Third-party services</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-white/10 rounded-xl overflow-hidden">
                <thead>
                  <tr className="bg-bg-secondary border-b border-white/10">
                    <th className="text-left p-3 text-cream font-medium">Service</th>
                    <th className="text-left p-3 text-cream font-medium">Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {[
                    ['Stripe', 'Payment processing'],
                    ['Cloudinary', 'Image & PDF storage'],
                    ['Replicate', 'AI image generation'],
                    ['Google Gemini / Groq', 'AI story generation'],
                    ['ElevenLabs', 'Voice narration (optional)'],
                    ['Gelato', 'Print-on-demand fulfillment'],
                  ].map(([svc, purpose]) => (
                    <tr key={svc} className="hover:bg-white/2">
                      <td className="p-3 text-gold font-medium">{svc}</td>
                      <td className="p-3 text-cream/70">{purpose}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-heading font-semibold text-white mb-3">6. Cookies</h2>
            <p className="mb-3">
              We use the following types of cookies:
            </p>
            <div className="space-y-2">
              {[
                { name: 'Essential', desc: 'Required for login, security, and book generation. Cannot be disabled.' },
                { name: 'Analytics', desc: 'Help us understand how features are used. Can be disabled.' },
                { name: 'Marketing', desc: 'Used for personalised recommendations. Can be disabled.' },
              ].map(({ name, desc }) => (
                <div key={name} className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-gold mt-2.5 flex-shrink-0" />
                  <p><span className="text-cream font-medium">{name}:</span> {desc}</p>
                </div>
              ))}
            </div>
            <button
              onClick={reset}
              className="mt-4 btn-secondary text-sm px-4 py-2"
            >
              Manage cookie preferences
            </button>
          </section>

          <section>
            <h2 className="text-xl font-heading font-semibold text-white mb-3">7. Your rights (GDPR)</h2>
            <p className="mb-3">Under GDPR you have the right to:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                'Access your data', 'Correct inaccurate data',
                'Delete your account and data', 'Export your data',
                'Withdraw consent', 'Lodge a complaint with your DPA',
              ].map((right) => (
                <div key={right} className="flex items-center gap-2 text-sm">
                  <span className="text-gold">✓</span> {right}
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm">
              To exercise any of these rights, email us at{' '}
              <a href={`mailto:${EMAIL}`} className="text-gold hover:underline">{EMAIL}</a>.
              We respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-heading font-semibold text-white mb-3">8. Data retention</h2>
            <p>
              Your account data is retained while your account is active. Deleted accounts are purged within 30 days.
              Anonymised usage data may be retained for up to 2 years for analytics purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-heading font-semibold text-white mb-3">9. Security</h2>
            <p>
              We use industry-standard encryption (TLS 1.3), bcrypt password hashing, JWT authentication,
              and secure cloud storage. No method of transmission is 100% secure — if you discover a security
              issue please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-heading font-semibold text-white mb-3">10. Changes to this policy</h2>
            <p>
              We may update this policy from time to time. We will notify you by email for significant changes.
              Continued use after changes means you accept the updated policy.
            </p>
          </section>

          <div className="border-t border-white/10 pt-6 text-sm text-muted">
            Questions? Email us at{' '}
            <a href={`mailto:${EMAIL}`} className="text-gold hover:underline">{EMAIL}</a>
          </div>
        </div>
      </div>
    </div>
  )
}
