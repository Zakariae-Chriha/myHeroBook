const router = require('express').Router()
const booksController = require('../controllers/books.controller')
const { authenticate, optionalAuth } = require('../middleware/auth.middleware')
const { validateBody, createBookSchema } = require('../middleware/validate.middleware')
const aiRateLimit = require('../middleware/aiRateLimit.middleware')

// Public route — QR code audio player (must be before authenticate middleware)
router.get('/:id/read/:pageNumber', optionalAuth, booksController.getReadPage)

router.use(authenticate)

router.post('/create', validateBody(createBookSchema), booksController.createBook)
router.get('/my-books', booksController.getMyBooks)
router.get('/:id', booksController.getBook)
router.post('/:id/generate-story', aiRateLimit, booksController.generateStory)
router.post('/:id/generate-images', aiRateLimit, booksController.generateImages)
router.post('/:id/generate-voice', aiRateLimit, booksController.generateVoice)
router.post('/:id/assemble-pdf', booksController.assemblePdf)
router.get('/:id/progress', booksController.getProgress)
router.get('/:id/preview-pages', booksController.getPreviewPages)
router.get('/:id/download-pdf', booksController.downloadPdf)
router.patch('/:id/cover', booksController.setCover)

module.exports = router
