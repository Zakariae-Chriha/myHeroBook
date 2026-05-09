// dotenv + DB are already initialised when loaded via server.js.
// When run standalone (npm run dev:worker) we boot them here.
if (!process.env.MONGODB_URI) {
  require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') })
}
const mongoose = require('mongoose')
if (mongoose.connection.readyState === 0) {
  require('../config/db')()
}
const logger = require('../utils/logger')

const imageQueue = require('../queues/imageQueue')
const storyQueue = require('../queues/storyQueue')
const voiceQueue = require('../queues/voiceQueue')
const pdfQueue = require('../queues/pdfQueue')

const BookProject = require('../models/BookProject')
const ChildProfile = require('../models/ChildProfile')
const { generateStory } = require('../services/ai/storyService')
const { generatePageImage } = require('../services/ai/imageService')
const { uploadFromUrl } = require('../services/storage/cloudinaryService')
const { assembleBook } = require('../services/pdf/pdfService')
const { uploadPdf, uploadAudio, getSignedDownloadUrl } = require('../services/storage/s3Service')
const { createPrintOrder } = require('../services/print/gelatoService')
const { synthesizePage } = require('../services/ai/voiceService')
const { generateAudioKey, chunk } = require('../utils/helpers')
const { generateQRCode } = require('../utils/generateQRCode')
const { uploadBuffer } = require('../services/storage/cloudinaryService')
const Order = require('../models/Order')
const User = require('../models/User')
const { sendDownloadReady, sendBookReady } = require('../services/email/emailService')

logger.info('Worker process started — waiting for jobs')

// ─── STORY QUEUE ─────────────────────────────────────────────────────────────
storyQueue.process(1, async (job) => {
  const { bookId } = job.data
  logger.info(`[storyQueue] Job ${job.id} — bookId: ${bookId}`)

  const book = await BookProject.findById(bookId)
  if (!book) throw new Error(`BookProject not found: ${bookId}`)

  // Skip if pipeline is past the story stage
  const skipStatuses = ['generating_voice', 'assembling_pdf', 'ready']
  if (skipStatuses.includes(book.status)) {
    logger.info(`[storyQueue] Book ${bookId} already in status "${book.status}" — skipping`)
    return
  }

  const child = await ChildProfile.findById(book.childId)
  if (!child) {
    await markFailed(book, `ChildProfile not found: ${book.childId}`)
    throw new Error(`ChildProfile not found: ${book.childId}`)
  }

  // If images are already done — go straight to PDF (e.g. PDF failed on previous attempt)
  const totalPages = book.story?.pages?.length || 16
  if (book.generationProgress.imagesCompleted >= totalPages) {
    logger.info(`[storyQueue] Images already done for book ${bookId} — going straight to PDF`)
    await advanceToPdf(bookId)
    return
  }

  // If story is already generated but images never started, skip story gen and re-dispatch images
  if (book.generationProgress.storyDone && book.story?.pages?.length) {
    logger.info(`[storyQueue] Story already done for book ${bookId} — re-dispatching image jobs`)
    book.status = 'generating_images'
    await book.save()
    await dispatchImageJobs(bookId, book.story.pages, book.artStyle, child.photoUrl)
    return
  }

  book.status = 'generating_story'
  await book.save()

  const bookParams = {
    chosenJob: book.chosenJob,
    artStyle: book.artStyle,
    storyTheme: book.storyTheme,
    episodeNumber: book.episodeNumber,
    dedication: book.dedication,
    language: book.language,
  }

  let story
  try {
    story = await generateStory(child, bookParams)
  } catch (err) {
    const isRateLimit = err.status === 429 || err.message?.includes('quota') || err.message?.includes('Too Many Requests')
    const friendlyReason = isRateLimit
      ? 'The AI service is busy right now. Please wait a minute and try again.'
      : 'Story generation failed. Please try again.'
    await markFailed(book, friendlyReason)
    throw err
  }

  book.title = story.title
  book.story = {
    fullText: story.pages.map((p) => p.text).join('\n\n'),
    pages: story.pages.map((p) => ({
      pageNumber: p.pageNumber,
      text: p.text,
      imagePrompt: p.imagePrompt,
    })),
  }
  book.generationProgress.storyDone = true
  book.markModified('generationProgress')
  book.markModified('story')
  book.status = 'generating_images'
  await book.save()

  logger.info(`[storyQueue] Story saved for book ${bookId}: "${story.title}"`)

  await dispatchImageJobs(bookId, story.pages, book.artStyle, child.photoUrl)
  logger.info(`[storyQueue] Dispatched ${story.pages.length} image jobs for book ${bookId}`)
})

// ─── IMAGE QUEUE ──────────────────────────────────────────────────────────────
imageQueue.process(parseInt(process.env.QUEUE_CONCURRENCY_IMAGES) || 4, async (job) => {
  const { bookId, pageNumber, imagePrompt, artStyle, childPhotoUrl } = job.data
  logger.info(`[imageQueue] Job ${job.id} — book ${bookId}, page ${pageNumber}`)

  // Verify book is still in an active state (not manually cancelled/failed)
  const bookCheck = await BookProject.findById(bookId).select('status tier')
  if (!bookCheck) throw new Error(`BookProject not found: ${bookId}`)
  if (bookCheck.status === 'failed') {
    logger.warn(`[imageQueue] Book ${bookId} is failed — skipping page ${pageNumber}`)
    return
  }

  // Generate stable Pollinations URL (instant — no download, no Cloudinary upload needed)
  const imageUrl = await generatePageImage(imagePrompt, childPhotoUrl, artStyle, bookId, pageNumber)
  logger.info(`[imageQueue] Image URL ready for book ${bookId} page ${pageNumber}`)

  // Store URL directly on the page
  await BookProject.updateOne(
    { _id: bookId },
    { $set: { 'story.pages.$[page].imageUrl': imageUrl } },
    { arrayFilters: [{ 'page.pageNumber': pageNumber }] }
  )

  // Atomically increment completed count and read the new total
  const updated = await BookProject.findByIdAndUpdate(
    bookId,
    { $inc: { 'generationProgress.imagesCompleted': 1 } },
    { new: true, select: 'generationProgress status tier' }
  )

  const completed = updated.generationProgress.imagesCompleted
  logger.info(`[imageQueue] Page ${pageNumber} done — ${completed}/16 images complete for book ${bookId}`)

  // Once all pages are illustrated, advance the pipeline (only if still in generating_images)
  if (completed >= 16 && updated.status === 'generating_images') {
    if (updated.tier === 'voice') {
      // Voice tier: generate narration for every page before PDF assembly
      await advanceToVoice(bookId, updated.tier)
    } else {
      // Digital + printed: go straight to PDF assembly
      await advanceToPdf(bookId)
    }
  }
})

// ─── VOICE QUEUE ─────────────────────────────────────────────────────────────
voiceQueue.process(parseInt(process.env.QUEUE_CONCURRENCY_VOICE) || 2, async (job) => {
  const { bookId, pageNumber, text, userId } = job.data
  logger.info(`[voiceQueue] Job ${job.id} — book ${bookId}, page ${pageNumber}`)

  // Verify book is still active
  const bookCheck = await BookProject.findById(bookId).select('status')
  if (!bookCheck) throw new Error(`BookProject not found: ${bookId}`)
  if (bookCheck.status === 'failed') {
    logger.warn(`[voiceQueue] Book ${bookId} failed — skipping page ${pageNumber}`)
    return
  }

  // Fetch the user's cloned ElevenLabs voice ID
  const user = await User.findById(userId).select('elevenLabsVoiceId')
  if (!user?.elevenLabsVoiceId) {
    throw new Error(`User ${userId} has no ElevenLabs voice ID — voice narration cannot proceed`)
  }

  // Synthesize TTS for this page
  let audioBuffer
  try {
    audioBuffer = await synthesizePage(user.elevenLabsVoiceId, text)
  } catch (err) {
    logger.error(`[voiceQueue] TTS failed for book ${bookId} page ${pageNumber}: ${err.message}`)
    throw err
  }

  // Upload MP3 to S3
  const s3Key = generateAudioKey(userId, bookId, pageNumber)
  try {
    await uploadAudio(audioBuffer, s3Key)
  } catch (err) {
    logger.error(`[voiceQueue] S3 audio upload failed for book ${bookId} page ${pageNumber}: ${err.message}`)
    throw err
  }

  // Persist audio S3 key on the page document
  await BookProject.updateOne(
    { _id: bookId },
    { $set: { 'story.pages.$[page].audioS3Key': s3Key } },
    { arrayFilters: [{ 'page.pageNumber': pageNumber }] }
  )

  // Atomically increment and check completion
  const updated = await BookProject.findByIdAndUpdate(
    bookId,
    { $inc: { 'generationProgress.voiceCompleted': 1 } },
    { new: true, select: 'generationProgress status' }
  )

  const completed = updated.generationProgress.voiceCompleted
  logger.info(`[voiceQueue] Page ${pageNumber} narrated — ${completed}/16 voice pages done for book ${bookId}`)

  // All pages narrated → advance to PDF assembly
  if (completed >= 16) {
    await advanceToPdf(bookId)
  }
})

// ─── PDF QUEUE ────────────────────────────────────────────────────────────────
pdfQueue.process(1, async (job) => {
  const { bookId } = job.data
  logger.info(`[pdfQueue] Job ${job.id} — bookId: ${bookId}`)

  const book = await BookProject.findById(bookId).populate('story')
  if (!book) throw new Error(`BookProject not found: ${bookId}`)
  if (book.status === 'failed') {
    logger.warn(`[pdfQueue] Book ${bookId} already failed — skipping`)
    return
  }

  const child = await ChildProfile.findById(book.childId).select(
    'name age gender photoUrl language culture hometown bestFriendName petName favoriteColor favoriteFood'
  )
  if (!child) {
    await markFailed(book, `ChildProfile not found: ${book.childId}`)
    throw new Error(`ChildProfile not found: ${book.childId}`)
  }

  // Generate the PDF buffer via Puppeteer
  let pdfBuffer
  try {
    pdfBuffer = await assembleBook(book, child)
  } catch (err) {
    await markFailed(book, `PDF assembly failed: ${err.message}`)
    throw err
  }

  // Upload PDF to Cloudinary — returns the permanent download URL
  let pdfUrl
  try {
    pdfUrl = await uploadPdf(pdfBuffer, `books/${bookId}/book.pdf`)
  } catch (err) {
    await markFailed(book, `PDF upload failed: ${err.message}`)
    throw err
  }

  // Mark book as fully ready — store the real Cloudinary URL
  book.pdfS3Key = pdfUrl
  book.pdfUrl = pdfUrl
  book.status = 'ready'
  book.generationProgress.pdfDone = true
  book.markModified('generationProgress')
  await book.save()

  logger.info(`[pdfQueue] Book ${bookId} is READY — PDF at ${pdfUrl} (${Math.round(pdfBuffer.length / 1024)} KB)`)

  // Notify book owner that preview is ready (non-blocking, sent to all users regardless of payment)
  const bookOwner = await User.findById(book.userId).select('firstName email').lean()
  if (bookOwner) {
    const previewUrl = `${process.env.CLIENT_URL}/preview/${bookId}`
    sendBookReady(bookOwner, book.title || 'Your Hero Book', previewUrl).catch((err) =>
      logger.error(`Book-ready email failed for book ${bookId}: ${err.message}`)
    )
  }

  // Link PDF to any existing paid order so download is immediately available
  const paidOrders = await Order.find(
    { bookId, status: 'paid', downloadS3Key: { $exists: false } }
  ).select('_id userId tier')

  if (paidOrders.length) {
    await Order.updateMany(
      { _id: { $in: paidOrders.map((o) => o._id) } },
      { $set: { downloadS3Key: pdfUrl } }
    )

    // Email download-ready notification to buyers (non-blocking)
    for (const ord of paidOrders) {
      const buyer = await User.findById(ord.userId).select('firstName email').lean()
      if (!buyer) continue
      sendDownloadReady(buyer, ord, pdfUrl).catch((err) =>
        logger.error(`Download-ready email failed for order ${ord._id}: ${err.message}`)
      )
    }
  }

  // Submit to Gelato for physical printing (printed + voice tiers)
  await submitPrintIfNeeded(bookId, book, pdfUrl)
})

// ─── QUEUE EVENT LOGGING ──────────────────────────────────────────────────────
;[storyQueue, imageQueue, voiceQueue, pdfQueue].forEach((q) => {
  q.on('completed', (job) => logger.info(`[${q.name}] Job ${job.id} completed`))
  q.on('failed', (job, err) => logger.error(`[${q.name}] Job ${job.id} failed: ${err.message}`))
  q.on('stalled', (job) => logger.warn(`[${q.name}] Job ${job.id} stalled`))
})

process.on('SIGTERM', async () => {
  logger.info('Worker shutting down...')
  await Promise.all([
    storyQueue.close(),
    imageQueue.close(),
    voiceQueue.close(),
    pdfQueue.close(),
  ])
  process.exit(0)
})

// ─── PIPELINE HELPERS ─────────────────────────────────────────────────────────

async function submitPrintIfNeeded(bookId, book, s3Key) {
  // Find a paid order for this book that needs physical printing and hasn't been submitted yet
  const order = await Order.findOne({
    bookId,
    tier: { $in: ['printed', 'voice'] },
    status: 'paid',
    'gelato.orderId': { $exists: false },
  })

  if (!order) {
    logger.info(`[pdfQueue] No pending print order found for book ${bookId} — skipping Gelato`)
    return
  }

  if (!order.shippingAddress) {
    logger.warn(`[pdfQueue] Order ${order._id} has no shipping address — cannot submit to Gelato`)
    return
  }

  // Generate a 7-day signed URL so Gelato can download the PDF
  const PDF_URL_TTL = 7 * 24 * 3600 // 7 days in seconds
  let pdfUrl
  try {
    pdfUrl = await getSignedDownloadUrl(process.env.AWS_S3_BUCKET_PDFS, s3Key, PDF_URL_TTL)
  } catch (err) {
    logger.error(`[pdfQueue] Failed to generate signed URL for Gelato: ${err.message}`)
    return
  }

  // Fetch buyer email for Gelato shipping record
  const user = await User.findById(order.userId).select('email')
  const userEmail = user?.email || ''

  let gelatoResult
  try {
    gelatoResult = await createPrintOrder(order, book, pdfUrl, userEmail)
  } catch (err) {
    logger.error(`[pdfQueue] Gelato submission failed for order ${order._id}: ${err.message}`)
    // Don't fail the whole PDF job — the admin can retry Gelato submission manually
    return
  }

  order.status = 'print_submitted'
  order.gelato = {
    orderId: gelatoResult.gelatoOrderId,
    status: gelatoResult.gelatoStatus,
  }
  await order.save()

  logger.info(`[pdfQueue] Print order submitted to Gelato: ${gelatoResult.gelatoOrderId} for order ${order._id}`)
}
async function advanceToPdf(bookId) {
  // Generate QR codes for voice tier before PDF assembly (they appear on each page)
  const bookForTier = await BookProject.findById(bookId).select('tier')
  if (bookForTier?.tier === 'voice') {
    await generateAndStoreQRCodes(bookId)
  }

  await BookProject.findByIdAndUpdate(bookId, { $set: { status: 'assembling_pdf' } })
  await pdfQueue.add({ bookId }, { attempts: 2, backoff: { type: 'fixed', delay: 3000 } })
  logger.info(`[worker] Dispatched PDF assembly job for book ${bookId}`)
}

async function generateAndStoreQRCodes(bookId) {
  const book = await BookProject.findById(bookId).select('story.pages.pageNumber')
  if (!book?.story?.pages?.length) return

  logger.info(`[worker] Generating ${book.story.pages.length} QR codes for book ${bookId}`)

  const batches = chunk(book.story.pages, 8)
  for (const batch of batches) {
    await Promise.all(
      batch.map(async (page) => {
        try {
          const qrBuffer = await generateQRCode(bookId, page.pageNumber)
          const result = await uploadBuffer(qrBuffer, `hero-books/${bookId}/qr-codes`)
          await BookProject.updateOne(
            { _id: bookId },
            {
              $set: {
                'story.pages.$[p].qrCodeUrl': result.secure_url,
                'story.pages.$[p].qrCodePublicId': result.public_id,
              },
            },
            { arrayFilters: [{ 'p.pageNumber': page.pageNumber }] }
          )
        } catch (err) {
          // Non-fatal — page renders without QR code if this fails
          logger.warn(`[worker] QR code failed for book ${bookId} page ${page.pageNumber}: ${err.message}`)
        }
      })
    )
  }

  logger.info(`[worker] QR codes complete for book ${bookId}`)
}

async function advanceToVoice(bookId) {
  const book = await BookProject.findById(bookId).select('story userId language')
  if (!book) return

  await BookProject.findByIdAndUpdate(bookId, { $set: { status: 'generating_voice' } })

  const voiceJobs = book.story.pages.map((page) => ({
    name: '__default__',
    data: {
      bookId,
      pageNumber: page.pageNumber,
      text: page.text,
      userId: book.userId.toString(),
      language: book.language || 'en',
    },
    opts: {
      jobId: `voice-${bookId}-p${page.pageNumber}`,
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: true,
    },
  }))

  await voiceQueue.addBulk(voiceJobs)
  logger.info(`[imageQueue] All images done — dispatched ${voiceJobs.length} voice jobs for book ${bookId}`)
}

async function dispatchImageJobs(bookId, pages, artStyle, childPhotoUrl) {
  const imageJobs = pages.map((page) => ({
    name: '__default__',
    data: {
      bookId,
      pageNumber: page.pageNumber,
      imagePrompt: page.imagePrompt,
      artStyle,
      childPhotoUrl,
    },
    opts: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: true,
    },
  }))
  await imageQueue.addBulk(imageJobs)
}

async function markFailed(book, reason) {
  book.status = 'failed'
  book.failureReason = reason
  await book.save()
  logger.error(`[worker] Book ${book._id} marked failed: ${reason}`)
}
