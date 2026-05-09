import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Camera, Mic, BookMarked, Globe2 } from 'lucide-react'

const FEATURES = [
  {
    icon: Camera,
    emoji: '🎨',
    title: 'Real Face AI Illustration',
    subtitle: 'Not a lookalike — their actual face',
    description: "Your child's real features are AI-illustrated into every single page using IP-Adapter face technology. Every spread, every scene — unmistakably them.",
    tag: 'Exclusive Technology',
    tagColor: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  },
  {
    icon: Mic,
    emoji: '🎙️',
    title: 'Parent Voice Cloning',
    subtitle: "Record 30 seconds — we clone your voice",
    description: "ElevenLabs clones your voice from a 30-second recording. Every page of the book is then narrated in your voice. Your child hears you reading to them — forever.",
    tag: 'Emotionally Priceless',
    tagColor: 'text-gold bg-gold/10 border-gold/20',
  },
  {
    icon: BookMarked,
    emoji: '📚',
    title: 'Hero Universe Series',
    subtitle: "Episode 1, 2, 3… a lifelong saga",
    description: "Every book you create is part of your child's growing Hero Universe. Return every birthday, every Christmas for the next chapter. The child grows up with their story.",
    tag: 'Recurring Revenue Engine',
    tagColor: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  },
  {
    icon: Globe2,
    emoji: '🌍',
    title: '50+ Languages & Cultures',
    subtitle: 'A book that feels like home',
    description: "Japanese family? Story set in Japan. Moroccan family? Arabic with their culture woven in. The story adapts to landscapes, names, traditions — truly global.",
    tag: 'Full Cultural Personalization',
    tagColor: 'text-green-400 bg-green-400/10 border-green-400/20',
  },
]

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.14 } },
}
const itemVariants = {
  hidden: { opacity: 0, x: -30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.55, ease: 'easeOut' } },
}

export default function UniqueSection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section className="py-24 bg-gradient-to-b from-bg-primary via-bg-secondary/30 to-bg-primary" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-gold text-sm font-medium uppercase tracking-widest">No Competitor Has This</span>
          <h2 className="section-title mt-3">
            What Makes This{' '}
            <span className="gold-text">Truly Unique</span>
          </h2>
          <p className="section-subtitle">
            Five years ahead of anything else on the market.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {FEATURES.map((f) => {
            const Icon = f.icon
            return (
              <motion.div
                key={f.title}
                variants={itemVariants}
                className="card p-7 group hover:-translate-y-1 hover:shadow-gold-glow transition-all duration-300 border border-white/5 hover:border-gold/20"
              >
                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-bg-primary border border-white/10 flex items-center justify-center text-3xl flex-shrink-0 group-hover:scale-110 transition-transform">
                    {f.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-white font-semibold text-lg font-heading">{f.title}</h3>
                    </div>
                    <p className="text-gold text-sm mb-2">{f.subtitle}</p>
                    <p className="text-muted text-sm leading-relaxed">{f.description}</p>
                    <span className={`inline-block mt-3 text-xs font-medium px-3 py-1 rounded-full border ${f.tagColor}`}>
                      {f.tag}
                    </span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
