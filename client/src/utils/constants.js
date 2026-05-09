export const DREAM_JOBS = [
  { id: 'astronaut', label: 'Astronaut', emoji: '🚀', description: 'Explore the stars and discover new worlds' },
  { id: 'doctor', label: 'Doctor', emoji: '👨‍⚕️', description: 'Heal people and save lives every day' },
  { id: 'chef', label: 'Chef', emoji: '🍳', description: 'Create magical dishes that bring joy' },
  { id: 'firefighter', label: 'Firefighter', emoji: '🚒', description: 'Be brave and protect the community' },
  { id: 'artist', label: 'Artist', emoji: '🎨', description: 'Create beauty and inspire the world' },
  { id: 'athlete', label: 'Athlete', emoji: '⚽', description: 'Champion of skill, speed and teamwork' },
  { id: 'superhero', label: 'Superhero', emoji: '🦸', description: 'Save the world with incredible powers' },
  { id: 'scientist', label: 'Scientist', emoji: '🔬', description: 'Discover secrets of the universe' },
  { id: 'musician', label: 'Musician', emoji: '🎵', description: 'Fill the world with beautiful music' },
  { id: 'teacher', label: 'Teacher', emoji: '🧑‍🏫', description: 'Share knowledge and change lives' },
  { id: 'programmer', label: 'Programmer', emoji: '🧑‍💻', description: 'Build amazing apps and digital worlds' },
  { id: 'pilot', label: 'Pilot', emoji: '✈️', description: 'Fly across the world on every adventure' },
]

export const STORY_THEMES = [
  { id: 'save-the-world', label: 'Save the World', emoji: '🌟', description: 'A grand mission to rescue everyone' },
  { id: 'magic-quest', label: 'Magic Quest', emoji: '🐉', description: 'A journey through an enchanted land' },
  { id: 'ocean-journey', label: 'Ocean Journey', emoji: '🌊', description: 'Adventure beneath the deep blue sea' },
  { id: 'mountain-hero', label: 'Mountain Hero', emoji: '🏔️', description: 'Conquer the highest peaks' },
  { id: 'city-adventure', label: 'City Adventure', emoji: '🌆', description: 'Urban hero in a bustling city' },
  { id: 'space-mission', label: 'Space Mission', emoji: '🌌', description: 'Journey to the stars and beyond' },
]

export const ART_STYLES = [
  { id: 'watercolor', label: 'Watercolor', description: 'Soft, dreamy watercolor illustrations' },
  { id: 'comic', label: 'Comic Book', description: 'Bold, vibrant comic-style art' },
  { id: 'storybook', label: 'Classic Storybook', description: 'Warm, classic fairy-tale illustrations' },
]

export const BOOK_TIERS = {
  digital: {
    id: 'digital',
    label: 'Digital Book',
    price: 9.99,
    priceCents: 999,
    priceDisplay: '€9.99',
    tagline: 'Keep the memory forever',
    features: [
      '16-page AI-illustrated PDF',
      "Child's real face illustrated throughout",
      '100% unique AI-generated story',
      'Instant download after payment',
      'Stored forever in your dashboard',
      'A4 format — ready to print at home',
    ],
    popular: false,
    color: 'muted',
  },
  printed: {
    id: 'printed',
    label: 'Printed Book',
    price: 34.99,
    priceCents: 3499,
    priceDisplay: '€34.99',
    tagline: 'Hold their story in your hands',
    features: [
      'Everything in Digital PDF',
      'Premium hardcover 20×20cm book',
      '130gsm silk interior pages',
      'QR code on every page plays narration',
      'Ships in premium gift-ready box',
      '5–7 business days delivery',
      'Tracking number by email',
    ],
    popular: true,
    color: 'gold',
  },
  voice: {
    id: 'voice',
    label: 'Magic Voice Book',
    price: 54.99,
    priceCents: 5499,
    priceDisplay: '€54.99',
    tagline: 'Let them hear your voice forever 💛',
    features: [
      'Everything in Printed Book',
      'Record 30s — AI clones your voice',
      '16 pages narrated in your own voice',
      'Gentle background music per page',
      'QR code plays YOUR voice reading',
      'Voice ID saved for future books',
      'Emotionally priceless experience',
    ],
    popular: false,
    color: 'accent',
  },
}

export const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'fr', label: 'French', native: 'Français' },
  { code: 'es', label: 'Spanish', native: 'Español' },
  { code: 'de', label: 'German', native: 'Deutsch' },
  { code: 'it', label: 'Italian', native: 'Italiano' },
  { code: 'pt', label: 'Portuguese', native: 'Português' },
  { code: 'nl', label: 'Dutch', native: 'Nederlands' },
  { code: 'ar', label: 'Arabic', native: 'العربية' },
  { code: 'zh', label: 'Chinese', native: '中文' },
  { code: 'ja', label: 'Japanese', native: '日本語' },
  { code: 'ko', label: 'Korean', native: '한국어' },
  { code: 'ru', label: 'Russian', native: 'Русский' },
  { code: 'pl', label: 'Polish', native: 'Polski' },
  { code: 'tr', label: 'Turkish', native: 'Türkçe' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'sv', label: 'Swedish', native: 'Svenska' },
  { code: 'da', label: 'Danish', native: 'Dansk' },
  { code: 'fi', label: 'Finnish', native: 'Suomi' },
  { code: 'no', label: 'Norwegian', native: 'Norsk' },
  { code: 'he', label: 'Hebrew', native: 'עברית' },
]

export const CULTURES = [
  'American', 'British', 'French', 'Spanish', 'Italian', 'German',
  'Japanese', 'Chinese', 'Korean', 'Indian', 'Brazilian', 'Mexican',
  'Moroccan', 'Egyptian', 'Nigerian', 'South African', 'Australian',
  'Canadian', 'Russian', 'Turkish', 'Greek', 'Swedish', 'Dutch',
  'Polish', 'Portuguese', 'Argentine', 'Colombian', 'Saudi', 'Israeli',
  'Iranian', 'Indonesian', 'Thai', 'Vietnamese', 'Filipino', 'Pakistani',
]

export const BOOK_STATUS = {
  DRAFT: 'draft',
  GENERATING_STORY: 'generating_story',
  GENERATING_IMAGES: 'generating_images',
  GENERATING_VOICE: 'generating_voice',
  ASSEMBLING_PDF: 'assembling_pdf',
  READY: 'ready',
  FAILED: 'failed',
}

export const ORDER_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  GENERATING: 'generating',
  PRINT_SUBMITTED: 'print_submitted',
  PRINT_CONFIRMED: 'print_confirmed',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  FAILED: 'failed',
  REFUNDED: 'refunded',
}

export const TOTAL_PAGES = 16
export const POLLING_INTERVAL_MS = 3000
export const MAX_PHOTO_SIZE_MB = 10
export const MIN_VOICE_RECORDING_SECONDS = 30
export const MAX_VOICE_RECORDING_SECONDS = 180
