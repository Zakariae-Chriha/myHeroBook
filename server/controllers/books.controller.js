const asyncHandler = require('express-async-handler')
const BookProject = require('../models/BookProject')
const ChildProfile = require('../models/ChildProfile')
const BookSeries = require('../models/BookSeries')
const { processBook } = require('../services/directProcessor')
const logger = require('../utils/logger')
const { createApiError } = require('../utils/helpers')
const { getSignedDownloadUrl } = require('../services/storage/s3Service')

function runInBackground(bookId) {
  setImmediate(() =>
    processBook(bookId).catch((err) =>
      logger.error(`[books] Background processing crashed for ${bookId}: ${err.message}`)
    )
  )
}

const PAGE_SIZE = 10

exports.createBook = asyncHandler(async (req, res) => {
  const { childId, chosenJob, artStyle, storyTheme, episodeNumber, dedication, tier, language, isGift, giftRecipient } = req.body

  if (!childId || !chosenJob) {
    throw createApiError('childId and chosenJob are required', 422)
  }

  const child = await ChildProfile.findOne({ _id: childId, userId: req.user._id })
  if (!child) throw createApiError('Child profile not found', 404)

  const series = await BookSeries.findOrCreateForChild(req.user._id, child._id, child.name)

  const title = `${child.name} and the ${chosenJob} Adventure!`

  const book = await BookProject.create({
    userId: req.user._id,
    childId: child._id,
    seriesId: series._id,
    episodeNumber: episodeNumber || series.getNextEpisodeNumber(),
    chosenJob: chosenJob.trim(),
    artStyle: artStyle || 'watercolor',
    storyTheme: storyTheme || 'save-the-world',
    title,
    dedication,
    tier,
    language: language || child.language || 'en',
    status: 'draft',
    isGift: Boolean(isGift),
    giftRecipient: isGift && giftRecipient ? giftRecipient.trim().slice(0, 100) : undefined,
  })

  res.status(201).json({ success: true, book })
})

exports.getMyBooks = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1)
  const skip = (page - 1) * PAGE_SIZE

  const [books, total] = await Promise.all([
    BookProject.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(PAGE_SIZE)
      .populate('childId', 'name age photoUrl')
      .lean(),
    BookProject.countDocuments({ userId: req.user._id }),
  ])

  res.json({
    success: true,
    books,
    pagination: { page, totalPages: Math.ceil(total / PAGE_SIZE), total },
  })
})

exports.getBook = asyncHandler(async (req, res) => {
  const book = await BookProject.findOne({ _id: req.params.id, userId: req.user._id })
    .populate('childId', 'name age gender photoUrl culture language bestFriendName petName favoriteColor hometown')
    .lean()

  if (!book) throw createApiError('Book not found', 404)
  res.json({ success: true, book })
})

exports.generateStory = asyncHandler(async (req, res) => {
  const book = await BookProject.findOne({ _id: req.params.id, userId: req.user._id })
  if (!book) throw createApiError('Book not found', 404)

  if (!['draft', 'failed', 'generating_story', 'generating_images'].includes(book.status)) {
    throw createApiError(`Cannot generate story — current status is "${book.status}"`, 409)
  }

  // Reset story if this is a fresh attempt with no saved story yet
  if (book.generationProgress.imagesCompleted === 0 && !book.story?.pages?.length) {
    book.generationProgress.storyDone = false
    book.markModified('generationProgress')
  }

  book.status = 'generating_story'
  book.failureReason = undefined
  await book.save()

  // Run generation in the background — response returns immediately
  runInBackground(book._id.toString())

  res.json({ success: true, message: 'Story generation started', bookId: book._id })
})

exports.generateImages = asyncHandler(async (req, res) => {
  const book = await BookProject.findOne({ _id: req.params.id, userId: req.user._id })
  if (!book) throw createApiError('Book not found', 404)

  if (!book.story?.pages?.length) {
    throw createApiError('Story must be generated before images', 409)
  }

  // Reset image progress and clear existing imageUrls
  book.generationProgress.imagesCompleted = 0
  book.generationProgress.pdfDone = false
  book.markModified('generationProgress')
  book.status = 'generating_images'
  book.failureReason = undefined
  await book.save()

  await BookProject.updateOne(
    { _id: book._id },
    { $unset: { 'story.pages.$[].imageUrl': 1 } }
  )

  // Re-run the full remaining pipeline (images → PDF) in background
  runInBackground(book._id.toString())

  res.json({ success: true, message: 'Image generation started', bookId: book._id })
})

exports.generateVoice = asyncHandler(async (req, res) => {
  // Voice narration not yet available — return a clear error
  throw createApiError('Voice narration feature coming soon', 501)
})

exports.assemblePdf = asyncHandler(async (req, res) => {
  const book = await BookProject.findOne({ _id: req.params.id, userId: req.user._id })
  if (!book) throw createApiError('Book not found', 404)

  if (book.generationProgress.imagesCompleted < 16) {
    throw createApiError('All images must be generated before assembling PDF', 409)
  }

  // Re-run the pipeline from the PDF step
  runInBackground(book._id.toString())

  res.json({ success: true, message: 'PDF assembly started', bookId: book._id })
})

exports.getProgress = asyncHandler(async (req, res) => {
  const book = await BookProject.findOne({ _id: req.params.id, userId: req.user._id })
    .select('status generationProgress failureReason title')
    .lean()

  if (!book) throw createApiError('Book not found', 404)

  const { generationProgress: p } = book
  let percentage = 0
  if (p.storyDone) percentage += 10
  percentage += ((p.imagesCompleted || 0) / 16) * 60
  if (p.voiceCompleted > 0) percentage += ((p.voiceCompleted || 0) / 16) * 20
  if (p.pdfDone) percentage += 10

  res.json({
    success: true,
    status: book.status,
    failureReason: book.failureReason || null,
    progress: book.generationProgress,
    percentage: Math.min(Math.round(percentage), 100),
  })
})

exports.getPreviewPages = asyncHandler(async (req, res) => {
  const book = await BookProject.findOne({ _id: req.params.id, userId: req.user._id })
    .select('story.pages title status')
    .lean()

  if (!book) throw createApiError('Book not found', 404)

  const pages = (book.story?.pages || []).map(({ pageNumber, text, imageUrl, qrCodeUrl }) => ({
    pageNumber,
    text,
    imageUrl: imageUrl || null,
    qrCodeUrl: qrCodeUrl || null,
  }))

  res.json({ success: true, title: book.title, pages, total: pages.length })
})

exports.downloadPdf = asyncHandler(async (req, res) => {
  const book = await BookProject.findOne({ _id: req.params.id, userId: req.user._id })
    .select('status pdfUrl pdfS3Key title')
    .lean()

  if (!book) throw createApiError('Book not found', 404)
  if (book.status !== 'ready') throw createApiError('PDF is not ready yet', 202)

  const pdfUrl = book.pdfUrl || book.pdfS3Key
  if (!pdfUrl || pdfUrl.startsWith('s3://')) {
    throw createApiError('PDF URL not available — please regenerate the book', 404)
  }

  // Build a safe ASCII filename then inject Cloudinary's fl_attachment flag so
  // the browser downloads the file directly instead of opening it in a new tab.
  const safeTitle = (book.title || 'hero-book')
    .replace(/[^a-z0-9\-_. ]/gi, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60) || 'hero-book'

  const downloadUrl = pdfUrl.includes('/upload/')
    ? pdfUrl.replace('/upload/', `/upload/fl_attachment:${safeTitle}.pdf/`)
    : pdfUrl

  res.json({ success: true, downloadUrl, title: book.title })
})

exports.setCover = asyncHandler(async (req, res) => {
  const { pageIndex } = req.body
  if (typeof pageIndex !== 'number' || pageIndex < 0) {
    throw createApiError('pageIndex must be a non-negative number', 422)
  }
  const book = await BookProject.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { $set: { coverPageIndex: pageIndex } },
    { new: true }
  ).select('coverPageIndex')
  if (!book) throw createApiError('Book not found', 404)
  res.json({ success: true, coverPageIndex: book.coverPageIndex })
})

// Public — accessible without auth (QR code scans from physical book)
exports.getReadPage = asyncHandler(async (req, res) => {
  const pageNumber = parseInt(req.params.pageNumber, 10)
  if (!pageNumber || pageNumber < 1 || pageNumber > 16) {
    throw createApiError('Invalid page number — must be 1–16', 400)
  }

  const book = await BookProject.findById(req.params.id)
    .select('title childId tier status story.pages language')
    .lean()

  if (!book) throw createApiError('Book not found', 404)
  if (book.status !== 'ready') throw createApiError('Book is not yet ready', 202)

  const page = (book.story?.pages || []).find((p) => p.pageNumber === pageNumber)
  if (!page) throw createApiError('Page not found', 404)

  const child = await ChildProfile.findById(book.childId).select('name').lean()

  // Generate a short-lived signed URL for the audio file (1 hour)
  let audioUrl = null
  if (book.tier === 'voice' && page.audioS3Key) {
    audioUrl = await getSignedDownloadUrl(
      process.env.AWS_S3_BUCKET_AUDIO,
      page.audioS3Key,
      3600
    )
  }

  res.json({
    success: true,
    bookId: book._id,
    bookTitle: book.title,
    childName: child?.name || null,
    language: book.language || 'en',
    pageNumber,
    totalPages: 16,
    text: page.text,
    imageUrl: page.imageUrl || null,
    audioUrl,
    hasAudio: Boolean(audioUrl),
    hasPrevPage: pageNumber > 1,
    hasNextPage: pageNumber < 16,
  })
})
