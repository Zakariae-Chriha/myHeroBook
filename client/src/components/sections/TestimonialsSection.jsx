import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Star, Quote } from 'lucide-react'

const TESTIMONIALS = [
  {
    name: 'Sophie Laurent',
    role: 'Mum of Emma, 6',
    location: 'Paris, France',
    avatar: '👩‍🦱',
    rating: 5,
    tier: 'Magic Voice Book',
    quote: "Emma cried when she heard my voice reading her name on every page. She carries the book everywhere. This is the most thoughtful gift I've ever given her — and I made it myself in 15 minutes.",
    job: 'Astronaut',
  },
  {
    name: 'James Okonkwo',
    role: 'Dad of Liam, 8',
    location: 'London, UK',
    avatar: '👨🏿',
    rating: 5,
    tier: 'Printed Book',
    quote: "I travel for work constantly. Liam falls asleep listening to the QR codes play my voice every night. I can't be there, but my voice can. This is priceless for any parent who travels.",
    job: 'Chef',
  },
  {
    name: 'Yuki Tanaka',
    role: 'Mum of Hana, 5',
    location: 'Tokyo, Japan',
    avatar: '👩🏻',
    rating: 5,
    tier: 'Printed Book',
    quote: "The story was set in Japan, with Hana visiting Mount Fuji and meeting Japanese characters. Her face was illustrated so perfectly I showed everyone at school. The art quality is unbelievable.",
    job: 'Scientist',
  },
  {
    name: 'Carlos Mendoza',
    role: 'Dad of Sofia, 7',
    location: 'Barcelona, Spain',
    avatar: '👨🏽',
    rating: 5,
    tier: 'Magic Voice Book',
    quote: "We ordered Episode 2 on her birthday last month. Sofia told me she's saving up for Episode 3 herself. She has never been this excited about reading. Our whole family reads together now.",
    job: 'Doctor',
  },
  {
    name: 'Amira Hassan',
    role: 'Mum of Youssef, 9',
    location: 'Casablanca, Morocco',
    avatar: '👩🏽',
    rating: 5,
    tier: 'Digital Book',
    quote: "A fully personalised book in Arabic with Moroccan landscapes and our culture? I've been searching for this for years. The €9.99 digital version is absolutely worth ten times the price.",
    job: 'Firefighter',
  },
  {
    name: 'Anna Petersen',
    role: 'Mum of Noah, 4',
    location: 'Copenhagen, Denmark',
    avatar: '👩🏼‍🦰',
    rating: 5,
    tier: 'Printed Book',
    quote: "My son can't read yet, but he sits there looking at every page pointing at himself saying 'That's me! That's me!' The look on his face when he opened the gift box — I filmed it and it's already at 80k views.",
    job: 'Superhero',
  },
]

function StarRating({ count }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className="w-4 h-4 fill-gold text-gold" />
      ))}
    </div>
  )
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}
const cardVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } },
}

export default function TestimonialsSection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section className="py-24 bg-gradient-to-b from-bg-primary via-bg-secondary/20 to-bg-primary" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-gold text-sm font-medium uppercase tracking-widest">2,400+ Happy Families</span>
          <h2 className="section-title mt-3">
            Parents Who've <span className="gold-text">Created the Magic</span>
          </h2>
          <div className="flex items-center justify-center gap-2 mt-4">
            <StarRating count={5} />
            <span className="text-white font-semibold">4.9 / 5</span>
            <span className="text-muted text-sm">from 847 verified reviews</span>
          </div>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              variants={cardVariants}
              className="card p-6 border border-white/5 hover:border-gold/20 hover:-translate-y-1 hover:shadow-gold-glow transition-all duration-300 flex flex-col"
            >
              {/* Quote icon */}
              <Quote className="w-8 h-8 text-gold/30 mb-3" />

              {/* Stars */}
              <StarRating count={t.rating} />

              {/* Quote */}
              <p className="text-cream text-sm leading-relaxed mt-3 flex-1">
                "{t.quote}"
              </p>

              {/* Footer */}
              <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-bg-primary border border-white/10 flex items-center justify-center text-xl">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{t.name}</p>
                    <p className="text-muted text-xs">{t.role} · {t.location}</p>
                  </div>
                </div>
                <span className="text-xs text-gold/70 bg-gold/5 border border-gold/15 rounded-full px-2.5 py-1 hidden sm:block">
                  {t.tier}
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
