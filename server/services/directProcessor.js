/**
 * Direct in-process book generation — no Redis/Bull required.
 * Runs story → images → PDF as chained async tasks in the background.
 */
const logger = require('../utils/logger')
const BookProject = require('../models/BookProject')
const ChildProfile = require('../models/ChildProfile')
const User = require('../models/User')
const Order = require('../models/Order')
const { generateStory } = require('./ai/storyService')
const { generatePageImage } = require('./ai/imageService')
const { assembleBook } = require('./pdf/pdfService')
const { uploadPdf } = require('./storage/s3Service')
const { sendBookReady, sendDownloadReady } = require('./email/emailService')

const IMAGE_CONCURRENCY = 16 // all images in parallel — Replicate handles the load

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}


async function markFailed(bookId, reason) {
  await BookProject.findByIdAndUpdate(bookId, { status: 'failed', failureReason: reason })
  logger.error(`[directProcessor] Book ${bookId} FAILED: ${reason}`)
}

// ── Story ─────────────────────────────────────────────────────────────────────
async function runStory(book, child) {
  const bookParams = {
    chosenJob: book.chosenJob,
    artStyle: book.artStyle,
    storyTheme: book.storyTheme,
    episodeNumber: book.episodeNumber,
    dedication: book.dedication,
    language: book.language,
  }

  const story = await generateStory(child, bookParams)

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

  logger.info(`[directProcessor] Story done: "${story.title}"`)
  return story.pages
}

// ── Images ────────────────────────────────────────────────────────────────────
async function runImages(bookId, pages, artStyle, childPhotoUrl) {
  logger.info(`[directProcessor] Generating all ${pages.length} images in parallel for book ${bookId}`)

  // Fire all 16 images at the same time — each saves itself to DB as it completes
  // so the user sees pages appearing one by one in real time
  await Promise.allSettled(
    pages.map(async (page) => {
      try {
        const imageUrl = await generatePageImage(
          page.imagePrompt,
          childPhotoUrl,
          artStyle,
          bookId,
          page.pageNumber,
        )

        await BookProject.updateOne(
          { _id: bookId },
          {
            $set: { [`story.pages.$[p].imageUrl`]: imageUrl },
            $inc: { 'generationProgress.imagesCompleted': 1 },
          },
          { arrayFilters: [{ 'p.pageNumber': page.pageNumber }] },
        )

        logger.info(`[directProcessor] Image ${page.pageNumber}/${pages.length} done — book ${bookId}`)
      } catch (err) {
        logger.warn(`[directProcessor] Image ${page.pageNumber} failed (skipped): ${err.message}`)
      }
    }),
  )
}

// ── PDF ───────────────────────────────────────────────────────────────────────
async function runPdf(bookId, child) {
  await BookProject.findByIdAndUpdate(bookId, { status: 'assembling_pdf' })

  const freshBook = await BookProject.findById(bookId)
  if (!freshBook) throw new Error('Book disappeared before PDF assembly')

  logger.info(`[directProcessor] Assembling PDF for book ${bookId}`)
  const pdfBuffer = await assembleBook(freshBook, child)
  const pdfUrl = await uploadPdf(pdfBuffer, `books/${bookId}/book.pdf`)

  freshBook.pdfUrl = pdfUrl
  freshBook.pdfS3Key = pdfUrl
  freshBook.status = 'ready'
  freshBook.generationProgress.pdfDone = true
  freshBook.markModified('generationProgress')
  await freshBook.save()

  logger.info(`[directProcessor] Book ${bookId} is READY — ${(pdfBuffer.length / 1024).toFixed(0)} KB PDF`)

  // Email the owner (non-blocking)
  const owner = await User.findById(freshBook.userId).select('firstName email').lean()
  if (owner) {
    const previewUrl = `${process.env.CLIENT_URL}/preview/${bookId}`
    sendBookReady(owner, freshBook.title || 'Your Hero Book', previewUrl).catch(() => {})
  }

  // Link PDF to any paid orders
  const paidOrders = await Order.find({
    bookId,
    status: 'paid',
    downloadS3Key: { $exists: false },
  }).select('_id userId')

  if (paidOrders.length) {
    await Order.updateMany(
      { _id: { $in: paidOrders.map((o) => o._id) } },
      { $set: { downloadS3Key: pdfUrl } },
    )
    for (const ord of paidOrders) {
      const buyer = await User.findById(ord.userId).select('firstName email').lean()
      if (buyer) sendDownloadReady(buyer, ord, pdfUrl).catch(() => {})
    }
  }
}

// ── Main entry point ──────────────────────────────────────────────────────────
exports.processBook = async function processBook(bookId) {
  logger.info(`[directProcessor] Starting pipeline for book ${bookId}`)

  let book
  try {
    book = await BookProject.findById(bookId)
    if (!book) return logger.error(`[directProcessor] Book not found: ${bookId}`)

    const child = await ChildProfile.findById(book.childId)
    if (!child) {
      await markFailed(bookId, 'Child profile not found')
      return
    }

    // ── Story ──────────────────────────────────────────────────────────────
    let pages
    if (!book.generationProgress.storyDone || !book.story?.pages?.length) {
      book.status = 'generating_story'
      await book.save()

      try {
        pages = await runStory(book, child)
      } catch (err) {
        const isQuota = err.status === 429 || /quota|rate.?limit|too many/i.test(err.message)
        await markFailed(bookId, isQuota
          ? 'AI is busy right now. Please wait 1 minute and click Retry.'
          : `Story failed: ${err.message}`)
        return
      }
    } else {
      pages = book.story.pages
      book.status = 'generating_images'
      await book.save()
    }

    // ── Images ─────────────────────────────────────────────────────────────
    try {
      // Re-fetch to get latest story pages (may have been updated above)
      const freshBook = await BookProject.findById(bookId).select('story artStyle')
      await runImages(bookId, freshBook.story.pages, freshBook.artStyle, child.photoUrl)
    } catch (err) {
      await markFailed(bookId, `Image generation failed: ${err.message}`)
      return
    }

    // ── PDF ────────────────────────────────────────────────────────────────
    try {
      await runPdf(bookId, child)
    } catch (err) {
      await markFailed(bookId, `PDF assembly failed: ${err.message}`)
    }
  } catch (err) {
    logger.error(`[directProcessor] Unexpected error for book ${bookId}: ${err.message}`)
    await markFailed(bookId, `Unexpected error: ${err.message}`)
  }
}
