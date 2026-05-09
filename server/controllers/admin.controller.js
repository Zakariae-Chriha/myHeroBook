const asyncHandler = require('express-async-handler')
const User = require('../models/User')
const BookProject = require('../models/BookProject')
const Order = require('../models/Order')
const PromoCode = require('../models/PromoCode')

const PAGE_SIZE = 20

// ── Stats ─────────────────────────────────────────────────────────────────────

exports.getStats = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalBooks,
    totalOrders,
    booksByStatus,
    revenueAgg,
    recentUsers,
  ] = await Promise.all([
    User.countDocuments(),
    BookProject.countDocuments(),
    Order.countDocuments(),
    BookProject.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: { status: { $in: ['paid', 'generating', 'print_submitted', 'print_confirmed', 'shipped', 'delivered'] } } },
      { $group: { _id: null, total: { $sum: '$price' } } },
    ]),
    User.find().sort({ createdAt: -1 }).limit(5).select('firstName lastName email createdAt').lean(),
  ])

  const statusMap = {}
  booksByStatus.forEach(({ _id, count }) => { statusMap[_id] = count })

  res.json({
    success: true,
    stats: {
      totalUsers,
      totalBooks,
      totalOrders,
      totalRevenue: revenueAgg[0]?.total || 0,
      booksByStatus: statusMap,
    },
    recentUsers,
  })
})

// ── Users ─────────────────────────────────────────────────────────────────────

exports.getUsers = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1)
  const skip = (page - 1) * PAGE_SIZE
  const search = req.query.search?.trim()

  const filter = search
    ? { $or: [
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
      ] }
    : {}

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(PAGE_SIZE)
      .select('firstName lastName email isAdmin isEmailVerified subscription createdAt lastLoginAt')
      .lean(),
    User.countDocuments(filter),
  ])

  // attach book count per user
  const userIds = users.map((u) => u._id)
  const bookCounts = await BookProject.aggregate([
    { $match: { userId: { $in: userIds } } },
    { $group: { _id: '$userId', count: { $sum: 1 } } },
  ])
  const bookCountMap = {}
  bookCounts.forEach(({ _id, count }) => { bookCountMap[_id.toString()] = count })

  const enriched = users.map((u) => ({
    ...u,
    bookCount: bookCountMap[u._id.toString()] || 0,
  }))

  res.json({
    success: true,
    users: enriched,
    pagination: { page, totalPages: Math.ceil(total / PAGE_SIZE), total },
  })
})

// ── Books ─────────────────────────────────────────────────────────────────────

exports.getBooks = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1)
  const skip = (page - 1) * PAGE_SIZE
  const status = req.query.status

  const filter = status ? { status } : {}

  const [books, total] = await Promise.all([
    BookProject.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(PAGE_SIZE)
      .populate('userId', 'firstName lastName email')
      .populate('childId', 'name')
      .select('title status tier language artStyle generationProgress createdAt failureReason')
      .lean(),
    BookProject.countDocuments(filter),
  ])

  res.json({
    success: true,
    books,
    pagination: { page, totalPages: Math.ceil(total / PAGE_SIZE), total },
  })
})

// ── Orders ────────────────────────────────────────────────────────────────────

exports.getOrders = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1)
  const skip = (page - 1) * PAGE_SIZE
  const status = req.query.status

  const filter = status ? { status } : {}

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(PAGE_SIZE)
      .populate('userId', 'firstName lastName email')
      .populate('bookId', 'title tier')
      .lean(),
    Order.countDocuments(filter),
  ])

  res.json({
    success: true,
    orders,
    pagination: { page, totalPages: Math.ceil(total / PAGE_SIZE), total },
  })
})

// ── Retry failed book ─────────────────────────────────────────────────────────

exports.retryBook = asyncHandler(async (req, res) => {
  const book = await BookProject.findById(req.params.id)
  if (!book) {
    res.status(404)
    throw new Error('Book not found')
  }

  const { processBook } = require('../services/directProcessor')

  book.status = 'draft'
  book.failureReason = undefined
  book.generationProgress = { storyDone: false, imagesCompleted: 0, voiceCompleted: 0, pdfDone: false }
  book.markModified('generationProgress')
  await book.save()

  setImmediate(() => processBook(book._id.toString()).catch(() => {}))

  res.json({ success: true, message: 'Book regeneration started', bookId: book._id })
})

// ── Promo codes ───────────────────────────────────────────────────────────────

exports.getPromoCodes = asyncHandler(async (req, res) => {
  const codes = await PromoCode.find().sort({ createdAt: -1 }).lean()
  res.json({ success: true, codes })
})

exports.createPromoCode = asyncHandler(async (req, res) => {
  const { code, discountType, discountValue, maxUses, expiresAt, note } = req.body
  if (!code || !discountType || discountValue === undefined) {
    res.status(422)
    throw new Error('code, discountType, and discountValue are required')
  }
  const promo = await PromoCode.create({
    code: code.toUpperCase().trim(),
    discountType,
    discountValue: parseFloat(discountValue),
    maxUses: maxUses || null,
    expiresAt: expiresAt || null,
    note: note || '',
  })
  res.status(201).json({ success: true, promo })
})

exports.updatePromoCode = asyncHandler(async (req, res) => {
  const { active } = req.body
  const promo = await PromoCode.findByIdAndUpdate(
    req.params.id,
    { $set: { active } },
    { new: true }
  )
  if (!promo) { res.status(404); throw new Error('Promo code not found') }
  res.json({ success: true, promo })
})

exports.deletePromoCode = asyncHandler(async (req, res) => {
  await PromoCode.findByIdAndDelete(req.params.id)
  res.json({ success: true })
})

// ── Toggle admin ──────────────────────────────────────────────────────────────

exports.toggleAdmin = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
  if (!user) { res.status(404); throw new Error('User not found') }

  if (user._id.toString() === req.user._id.toString()) {
    res.status(400)
    throw new Error('You cannot change your own admin status')
  }

  user.isAdmin = !user.isAdmin
  await user.save({ validateBeforeSave: false })

  res.json({ success: true, isAdmin: user.isAdmin, userId: user._id })
})
