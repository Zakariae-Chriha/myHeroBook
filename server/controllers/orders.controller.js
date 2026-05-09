const asyncHandler = require('express-async-handler')
const Order = require('../models/Order')
const BookProject = require('../models/BookProject')
const User = require('../models/User')
const PromoCode = require('../models/PromoCode')
const stripe = require('../config/stripe')
const { getSignedDownloadUrl } = require('../services/storage/s3Service')
const { createApiError } = require('../utils/helpers')
const { sendOrderConfirmation } = require('../services/email/emailService')
const logger = require('../utils/logger')

const PAGE_SIZE = 10

const TIER_PRICES = {
  digital: 999,
  printed: 3499,
  voice: 5499,
}

const TIER_NAMES = {
  digital: 'Digital Book — Hero Kids StoryLab',
  printed: 'Printed Hardcover Book — Hero Kids StoryLab',
  voice: 'Magic Voice Book — Hero Kids StoryLab',
}

exports.validatePromo = asyncHandler(async (req, res) => {
  const { code, tier } = req.body
  if (!code) throw createApiError('Promo code is required', 422)
  if (!TIER_PRICES[tier]) throw createApiError('Invalid tier', 422)

  const promo = await PromoCode.findOne({ code: code.toUpperCase().trim(), active: true })
  if (!promo) throw createApiError('Invalid promo code', 404)
  if (promo.expiresAt && promo.expiresAt < new Date()) throw createApiError('Promo code has expired', 410)
  if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) {
    throw createApiError('Promo code has reached its usage limit', 410)
  }

  const basePrice = TIER_PRICES[tier]
  const discountCents = promo.discountType === 'percentage'
    ? Math.round(basePrice * promo.discountValue / 100)
    : Math.min(Math.round(promo.discountValue * 100), basePrice)

  res.json({
    success: true,
    discount: {
      code: promo.code,
      type: promo.discountType,
      value: promo.discountValue,
      amountOff: discountCents,
      finalPrice: basePrice - discountCents,
    },
  })
})

exports.createCheckoutSession = asyncHandler(async (req, res) => {
  const { bookId, tier, shippingAddress, addons = [], promoCode } = req.body

  if (!bookId || !tier) throw createApiError('bookId and tier are required', 422)
  if (!TIER_PRICES[tier]) throw createApiError('Invalid tier — must be digital, printed, or voice', 422)

  const book = await BookProject.findOne({ _id: bookId, userId: req.user._id })
  if (!book) throw createApiError('Book not found', 404)

  // Resolve promo code discount
  let promoDiscountCents = 0
  let appliedPromo = null
  if (promoCode) {
    const promo = await PromoCode.findOne({ code: promoCode.toUpperCase().trim(), active: true })
    if (promo && (!promo.expiresAt || promo.expiresAt > new Date()) &&
        (promo.maxUses === null || promo.usedCount < promo.maxUses)) {
      promoDiscountCents = promo.discountType === 'percentage'
        ? Math.round(TIER_PRICES[tier] * promo.discountValue / 100)
        : Math.min(Math.round(promo.discountValue * 100), TIER_PRICES[tier])
      appliedPromo = promo
    }
  }

  const discountedBasePrice = TIER_PRICES[tier] - promoDiscountCents

  // Build line items
  const lineItems = [
    {
      price_data: {
        currency: 'eur',
        product_data: { name: TIER_NAMES[tier] },
        unit_amount: discountedBasePrice,
      },
      quantity: 1,
    },
  ]

  const ADDON_PRICES = {
    rush_printing: { amount: 999, label: 'Rush Printing (2–3 days)' },
    extra_copy: { amount: 1999, label: 'Extra Copy' },
    gift_wrap: { amount: 499, label: 'Gift Wrapping' },
    voice_addon: { amount: 1499, label: 'Voice Narration Add-on' },
  }

  const validAddons = []
  for (const addon of addons) {
    const info = ADDON_PRICES[addon]
    if (!info) continue
    lineItems.push({
      price_data: {
        currency: 'eur',
        product_data: { name: info.label },
        unit_amount: info.amount,
      },
      quantity: 1,
    })
    validAddons.push({ type: addon, price: info.amount / 100 })
  }

  const totalCents = lineItems.reduce((sum, item) => sum + item.price_data.unit_amount, 0)

  // Create pending order first so we have an ID for metadata
  const order = await Order.create({
    userId: req.user._id,
    bookId: book._id,
    tier,
    price: TIER_PRICES[tier] / 100,
    currency: 'eur',
    addons: validAddons,
    shippingAddress: shippingAddress || undefined,
    status: 'pending',
  })

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: lineItems,
    ui_mode: 'embedded',
    return_url: `${process.env.CLIENT_URL}/dashboard?order=${order._id}&session_id={CHECKOUT_SESSION_ID}`,
    customer_email: req.user.email,
    metadata: {
      orderId: order._id.toString(),
      bookId: book._id.toString(),
      userId: req.user._id.toString(),
      tier,
    },
    shipping_address_collection: ['printed', 'voice'].includes(tier)
      ? { allowed_countries: ['FR', 'DE', 'GB', 'US', 'CA', 'AU', 'ES', 'IT', 'NL', 'BE', 'PT', 'MA', 'JP', 'KR'] }
      : undefined,
  })

  order.stripe = { sessionId: session.id }
  await order.save()

  if (appliedPromo) {
    PromoCode.findByIdAndUpdate(appliedPromo._id, { $inc: { usedCount: 1 } }).catch(() => {})
  }

  res.json({ success: true, clientSecret: session.client_secret, orderId: order._id })
})

exports.getMyOrders = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1)
  const skip = (page - 1) * PAGE_SIZE

  const [orders, total] = await Promise.all([
    Order.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(PAGE_SIZE)
      .populate('bookId', 'title childId status tier')
      .lean(),
    Order.countDocuments({ userId: req.user._id }),
  ])

  res.json({
    success: true,
    orders,
    pagination: { page, totalPages: Math.ceil(total / PAGE_SIZE), total },
  })
})

exports.getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, userId: req.user._id })
    .populate('bookId', 'title childId status generationProgress pdfUrl tier')
    .lean()

  if (!order) throw createApiError('Order not found', 404)
  res.json({ success: true, order })
})

exports.getDownloadUrl = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, userId: req.user._id })
  if (!order) throw createApiError('Order not found', 404)

  if (!order.isPaid) throw createApiError('Order has not been paid', 403)

  // Return cached URL if still valid (more than 1 hour remaining)
  if (order.downloadUrl && order.downloadExpiresAt > new Date(Date.now() + 3600_000)) {
    return res.json({ success: true, downloadUrl: order.downloadUrl, expiresAt: order.downloadExpiresAt })
  }

  if (!order.downloadS3Key) throw createApiError('Download not yet available — book is still being generated', 202)

  const expiresInSeconds = parseInt(process.env.AWS_S3_SIGNED_URL_EXPIRES) || 604800
  const url = await getSignedDownloadUrl(
    process.env.AWS_S3_BUCKET_PDFS,
    order.downloadS3Key,
    expiresInSeconds
  )

  order.downloadUrl = url
  order.downloadExpiresAt = new Date(Date.now() + expiresInSeconds * 1000)
  await order.save()

  res.json({ success: true, downloadUrl: url, expiresAt: order.downloadExpiresAt })
})

exports.verifyPayment = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, userId: req.user._id })
  if (!order) throw createApiError('Order not found', 404)

  // Already paid — nothing to do
  if (order.status !== 'pending') {
    return res.json({ success: true, status: order.status, alreadyProcessed: true })
  }

  const { sessionId } = req.body
  if (!sessionId) throw createApiError('sessionId is required', 422)

  // Verify with Stripe
  const session = await stripe.checkout.sessions.retrieve(sessionId)
  if (session.payment_status !== 'paid') {
    return res.json({ success: false, status: 'unpaid' })
  }

  // Mark order paid
  await order.markPaid({
    sessionId: session.id,
    paymentIntentId: session.payment_intent,
    receiptUrl: session.receipt_url || null,
  })

  // Link PDF if book already assembled
  const book = await BookProject.findById(order.bookId)
  if (book?.pdfUrl) {
    order.downloadS3Key = book.pdfUrl
    await order.save()
  }

  // Send confirmation email
  const buyer = await User.findById(req.user._id).select('firstName email').lean()
  if (buyer) {
    sendOrderConfirmation(buyer, order).catch((err) =>
      logger.error(`Order confirmation email failed: ${err.message}`)
    )
  }

  logger.info(`Order ${order._id} verified and marked paid via session ${session.id}`)
  res.json({ success: true, status: order.status, pdfUrl: book?.pdfUrl || null })
})
