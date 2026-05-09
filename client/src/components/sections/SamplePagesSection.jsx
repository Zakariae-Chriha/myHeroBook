import { useRef, useState } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react'

// Fixed-seed Pollinations images — deterministic, load consistently
const SAMPLE_BOOKS = [
  {
    childName: 'Emma',
    age: 7,
    job: 'Astronaut',
    artStyle: 'Watercolor',
    artColor: '#818cf8',
    theme: 'Space Mission',
    emoji: '🚀',
    gradient: 'from-indigo-950 via-[#0d1228] to-bg-primary',
    accent: '#818cf8',
    pages: [
      {
        number: 1,
        text: 'Emma floated through the stars, her golden helmet gleaming in the moonlight. The whole galaxy was waiting for its bravest hero.',
        imgSeed: 9001,
        prompt: 'brave young girl hero in pink outfit floating in outer space among glowing stars, stunning watercolor illustration, soft luminous color washes, warm pastel tones, gentle whimsical atmosphere, award-winning picture book illustration, warm golden light, no text',
      },
      {
        number: 8,
        text: 'She steered her rocket past the rings of Saturn, the crystals sparkling like ten thousand diamonds all around her.',
        imgSeed: 9002,
        prompt: 'brave young girl hero in pink outfit piloting a small rocket past saturn rings, stunning watercolor illustration, soft luminous color washes, cosmic backdrop, warm pastel tones, award-winning picture book illustration, cool moonlight, no text',
      },
      {
        number: 14,
        text: '"Emma saved the galaxy!" the alien queen declared, placing a crown of stardust on the brave young hero\'s head.',
        imgSeed: 9003,
        prompt: 'brave young girl hero in pink outfit receiving a stardust crown from alien queen on floating palace, stunning watercolor illustration, soft luminous color washes, triumphal scene, warm golden light, award-winning picture book illustration, no text',
      },
    ],
  },
  {
    childName: 'Liam',
    age: 6,
    job: 'Chef',
    artStyle: 'Comic',
    artColor: '#f97316',
    theme: 'Magic Quest',
    emoji: '🍳',
    gradient: 'from-orange-950 via-[#1a0e05] to-bg-primary',
    accent: '#f97316',
    pages: [
      {
        number: 1,
        text: 'Liam put on his magical chef\'s hat and entered the enchanted kitchen. Something incredible was about to be cooked up!',
        imgSeed: 8001,
        prompt: 'brave young boy hero in orange outfit standing in magical glowing enchanted castle kitchen, vibrant comic book illustration, bold confident ink outlines, bright saturated flat colors, dynamic composition, professional comic artist quality, flickering torchlight, no text',
      },
      {
        number: 6,
        text: 'The great dragon sniffed the air — then smiled the biggest smile it had ever smiled. Nobody had ever cooked it magical cinnamon pancakes before!',
        imgSeed: 8002,
        prompt: 'brave young boy hero in orange outfit cooking pancakes for a friendly smiling dragon in cave, vibrant comic book illustration, bold confident ink outlines, bright saturated flat colors, warm firelight, professional comic artist quality, no text',
      },
      {
        number: 15,
        text: 'The whole enchanted kingdom tasted Liam\'s legendary feast and cheered. The magical food had broken the curse and saved everyone!',
        imgSeed: 8003,
        prompt: 'brave young boy hero in orange outfit serving magical food at huge castle banquet with cheering crowd, vibrant comic book illustration, bold outlines, bright colors, triumphant celebration, blazing noon sun, professional comic artist quality, no text',
      },
    ],
  },
  {
    childName: 'Sofia',
    age: 8,
    job: 'Doctor',
    artStyle: 'Storybook',
    artColor: '#2dd4bf',
    theme: 'Ocean Journey',
    emoji: '🌊',
    gradient: 'from-teal-950 via-[#051518] to-bg-primary',
    accent: '#2dd4bf',
    pages: [
      {
        number: 1,
        text: 'Sofia tied her stethoscope around her neck and dove into the shimmering ocean. Deep below, someone needed her help.',
        imgSeed: 7001,
        prompt: 'brave young girl hero in teal outfit diving into shimmering ocean entrance, classic fairy-tale storybook illustration, detailed pen-and-ink with rich warm color wash, golden hour lighting, whimsical detailed underwater world beginning, master illustrator quality, no text',
      },
      {
        number: 7,
        text: 'A great blue whale was hurt and frightened. Sofia placed her hand gently on its side and whispered, "I know exactly what to do."',
        imgSeed: 7002,
        prompt: 'brave young girl hero in teal outfit gently healing a giant blue whale in underwater kingdom, classic storybook illustration, detailed pen-and-ink with rich color wash, soft magical twilight underwater, whimsical detailed scene, master illustrator quality, no text',
      },
      {
        number: 14,
        text: 'Thousands of fish, dolphins, and seahorses formed a sparkling parade as Sofia swam back to the surface, their greatest hero forever.',
        imgSeed: 7003,
        prompt: 'brave young girl hero in teal outfit swimming triumphantly surrounded by joyful sea creatures parade, classic storybook illustration, detailed pen-and-ink, rainbow after storm light, whimsical celebration underwater scene, master illustrator quality, no text',
      },
    ],
  },
]

function makeImageUrl(prompt, seed) {
  const encoded = encodeURIComponent(`${prompt}`)
  return `https://image.pollinations.ai/prompt/${encoded}?width=512&height=512&model=flux&nologo=true&seed=${seed}`
}

function BookSpread({ book }) {
  const [pageIdx, setPageIdx] = useState(0)
  const page = book.pages[pageIdx]
  const imgUrl = makeImageUrl(page.prompt, page.imgSeed)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgError, setImgError] = useState(false)

  const goNext = () => { setPageIdx((i) => (i + 1) % book.pages.length); setImgLoaded(false); setImgError(false) }
  const goPrev = () => { setPageIdx((i) => (i - 1 + book.pages.length) % book.pages.length); setImgLoaded(false); setImgError(false) }

  return (
    <div className={`rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br ${book.gradient} shadow-2xl`}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/8">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{book.emoji}</span>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">
              {book.childName} &amp; the {book.job} Adventure
            </p>
            <p className="text-xs" style={{ color: book.accent }}>{book.artStyle} style · Age {book.age}</p>
          </div>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${book.accent}20`, color: book.accent, border: `1px solid ${book.accent}40` }}>
          16 pages
        </span>
      </div>

      {/* Spread: illustration + text */}
      <div className="flex flex-col sm:flex-row">
        {/* Illustration */}
        <div className="relative sm:w-1/2 aspect-square bg-bg-primary overflow-hidden flex-shrink-0">
          {!imgError ? (
            <>
              {!imgLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-bg-secondary">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                  >
                    <BookOpen className="w-8 h-8 text-muted" />
                  </motion.div>
                </div>
              )}
              <AnimatePresence>
                <motion.img
                  key={`${page.imgSeed}-${pageIdx}`}
                  src={imgUrl}
                  alt={`Page ${page.number}`}
                  className="w-full h-full object-cover"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: imgLoaded ? 1 : 0 }}
                  transition={{ duration: 0.5 }}
                  onLoad={() => setImgLoaded(true)}
                  onError={() => setImgError(true)}
                />
              </AnimatePresence>
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-bg-secondary text-muted">
              <span className="text-4xl">{book.emoji}</span>
              <p className="text-xs text-center px-4">AI illustration</p>
            </div>
          )}

          {/* Page number badge */}
          <div
            className="absolute bottom-2 left-2 text-xs px-2 py-0.5 rounded-full backdrop-blur font-medium"
            style={{ background: `${book.accent}30`, color: book.accent }}
          >
            Page {page.number}
          </div>
        </div>

        {/* Story text */}
        <div className="sm:w-1/2 flex flex-col justify-between p-5 gap-4 min-h-[200px]">
          <p className="text-cream leading-relaxed text-sm flex-1 font-body">
            "{page.text}"
          </p>

          {/* Nav */}
          <div className="flex items-center justify-between mt-auto">
            <button
              onClick={goPrev}
              className="p-1.5 rounded-lg bg-white/8 hover:bg-white/15 text-muted hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex gap-1.5">
              {book.pages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setPageIdx(i); setImgLoaded(false); setImgError(false) }}
                  className="w-1.5 h-1.5 rounded-full transition-all"
                  style={{ background: i === pageIdx ? book.accent : 'rgba(255,255,255,0.2)' }}
                />
              ))}
            </div>
            <button
              onClick={goNext}
              className="p-1.5 rounded-lg bg-white/8 hover:bg-white/15 text-muted hover:text-white transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, transparent, ${book.accent}, transparent)` }} />
    </div>
  )
}

export default function SamplePagesSection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section id="gallery" className="py-24" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="text-gold text-sm font-medium uppercase tracking-widest">Real Books, Real Children</span>
          <h2 className="section-title mt-3">
            See the <span className="gold-text">Magic</span> in Action
          </h2>
          <p className="section-subtitle">
            Every book is 100% unique — same child, different story every time. Three art styles to choose from.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {SAMPLE_BOOKS.map((book, i) => (
            <motion.div
              key={book.childName}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.15 }}
            >
              <BookSpread book={book} />
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.9 }}
          className="text-center text-muted text-sm mt-10"
        >
          Each illustration is generated fresh for every book — no two books look the same ✨
        </motion.p>
      </div>
    </section>
  )
}
