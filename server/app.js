require('dotenv').config()
const Sentry = require('@sentry/node')
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const cookieParser = require('cookie-parser')
const rateLimit = require('express-rate-limit')

// Sentry must be initialised before any other require that might throw
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 0,
  })
}

const path = require('path')
const fs = require('fs')
const errorHandler = require('./middleware/errorHandler')
const logger = require('./utils/logger')

// Route imports
const authRoutes = require('./routes/auth.routes')
const childrenRoutes = require('./routes/children.routes')
const booksRoutes = require('./routes/books.routes')
const ordersRoutes = require('./routes/orders.routes')
const seriesRoutes = require('./routes/series.routes')
const voiceRoutes = require('./routes/voice.routes')
const webhookRoutes = require('./routes/webhooks.routes')
const adminRoutes = require('./routes/admin.routes')

const app = express()

// ─── Trust proxy (for rate limiting behind nginx/load balancer)
app.set('trust proxy', 1)

// ─── Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}))

// ─── CORS
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',')
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true)
    // In development allow any localhost port
    if (process.env.NODE_ENV !== 'production' && origin.startsWith('http://localhost')) {
      return cb(null, true)
    }
    if (allowedOrigins.includes(origin)) return cb(null, true)
    cb(new Error(`CORS blocked: ${origin}`))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// ─── Stripe webhook must receive raw body BEFORE json parsing
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }))
app.use('/api/webhooks/gelato', express.raw({ type: 'application/json' }))

// ─── Body parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cookieParser())

// ─── Request logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: { write: (msg) => logger.http(msg.trim()) },
  }))
}

// ─── Global rate limiter
app.use('/api/', rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
}))

// ─── Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }))

// ─── Serve locally stored PDFs (bypasses Cloudinary 10 MB raw file limit)
const pdfDir = path.join(__dirname, 'temp/pdfs')
fs.mkdirSync(pdfDir, { recursive: true })
app.use('/api/pdfs', express.static(pdfDir, {
  setHeaders: (res, filePath) => {
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filePath)}"`)
  },
}))

// ─── Routes
app.use('/api/auth', authRoutes)
app.use('/api/children', childrenRoutes)
app.use('/api/books', booksRoutes)
app.use('/api/orders', ordersRoutes)
app.use('/api/series', seriesRoutes)
app.use('/api/voice', voiceRoutes)
app.use('/api/webhooks', webhookRoutes)
app.use('/api/admin', adminRoutes)

// Serve React SPA in production — handles /read/:bookId/:pageNumber QR scans
const clientBuild = path.join(__dirname, '../client/dist')
if (fs.existsSync(clientBuild)) {
  app.use(express.static(clientBuild))
  app.get('*', (req, res) => res.sendFile(path.join(clientBuild, 'index.html')))
}

// ─── 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` })
})

// ─── Sentry error handler (must be after routes, before custom handler)
if (process.env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app)
}

// ─── Global error handler
app.use(errorHandler)

module.exports = app
