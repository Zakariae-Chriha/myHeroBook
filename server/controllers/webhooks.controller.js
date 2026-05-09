const asyncHandler = require('express-async-handler')
const stripe = require('../config/stripe')
const Order = require('../models/Order')
const BookProject = require('../models/BookProject')
const User = require('../models/User')
const { processBook } = require('../services/directProcessor')

function runInBackground(bookId) {
  setImmediate(() =>
    processBook(bookId).catch((err) =>
      logger.error(`[webhooks] Background processing crashed for ${bookId}: ${err.message}`)
    )
  )
}
const logger = require('../utils/logger')
const { sendOrderConfirmation, sendTrackingUpdate } = require('../services/email/emailService')

// ─── Stripe Webhook ──────────────────────────────────────────────────────────

exports.handleStripe = asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature']
  let event

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    logger.warn(`Stripe webhook signature verification failed: ${err.message}`)
    return res.status(400).json({ error: `Webhook Error: ${err.message}` })
  }

  logger.info(`Stripe event received: ${event.type}`)

  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object)
      break

    case 'payment_intent.succeeded':
      await handlePaymentSucceeded(event.data.object)
      break

    case 'payment_intent.payment_failed':
      await handlePaymentFailed(event.data.object)
      break

    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      await handleSubscriptionChange(event.data.object)
      break

    default:
      logger.info(`Unhandled Stripe event: ${event.type}`)
  }

  res.json({ received: true })
})

async function handleCheckoutCompleted(session) {
  const { orderId, bookId, userId, tier } = session.metadata || {}
  if (!orderId) return logger.warn('checkout.session.completed missing orderId metadata')

  const order = await Order.findById(orderId)
  if (!order) return logger.warn(`Order ${orderId} not found`)
  if (order.status !== 'pending') return // already processed (idempotent)

  await order.markPaid({
    sessionId: session.id,
    paymentIntentId: session.payment_intent,
    receiptUrl: session.receipt_url || null,
  })

  // Save Stripe-collected shipping address (for printed/voice tiers)
  if (session.shipping_details?.address) {
    const addr = session.shipping_details.address
    order.shippingAddress = {
      fullName: session.shipping_details.name || '',
      line1: addr.line1 || '',
      line2: addr.line2 || undefined,
      city: addr.city || '',
      state: addr.state || undefined,
      postalCode: addr.postal_code || '',
      country: addr.country || '',
    }
    await order.save()
  }

  // Update book tier if not already set
  const book = await BookProject.findById(bookId)
  if (book && !book.tier) {
    book.tier = tier
    await book.save()
  }

  // If book is already fully generated (preview-before-pay flow), link PDF to order
  if (book?.pdfS3Key) {
    await Order.findByIdAndUpdate(orderId, { downloadS3Key: book.pdfS3Key })
    logger.info(`Order ${orderId} — PDF already ready, downloadS3Key linked`)
  }

  // Deduct from subscription quota if on a plan
  if (tier === 'digital') {
    const user = await User.findById(userId)
    if (user?.subscription?.booksRemaining > 0) {
      await User.findByIdAndUpdate(userId, {
        $inc: { 'subscription.booksRemaining': -1 },
      })
    }
  }

  // Send order confirmation email (non-blocking)
  const buyer = await User.findById(userId).select('firstName email').lean()
  if (buyer) {
    sendOrderConfirmation(buyer, order).catch((err) =>
      logger.error(`Order confirmation email failed for order ${orderId}: ${err.message}`)
    )
  }

  // Only start generation if book hasn't already been generated
  const generatingStatuses = ['generating_story', 'generating_images', 'generating_voice', 'assembling_pdf', 'ready']
  if (!book || !generatingStatuses.includes(book.status)) {
    runInBackground(bookId)
    logger.info(`Order ${orderId} paid — story generation started for book ${bookId}`)
  } else {
    logger.info(`Order ${orderId} paid — book ${bookId} already in status "${book?.status}", skipping`)
  }
}

async function handlePaymentSucceeded(paymentIntent) {
  // Additional handling if needed — primary flow is checkout.session.completed
  logger.info(`Payment intent succeeded: ${paymentIntent.id}`)
}

async function handlePaymentFailed(paymentIntent) {
  const order = await Order.findOne({ 'stripe.paymentIntentId': paymentIntent.id })
  if (!order) return

  order.status = 'failed'
  await order.save()
  logger.warn(`Payment failed for order ${order._id}`)
}

async function handleSubscriptionChange(subscription) {
  const user = await User.findOne({ 'subscription.stripeSubscriptionId': subscription.id })
  if (!user) return

  const isActive = subscription.status === 'active'
  const plan = subscription.items?.data?.[0]?.price?.lookup_key || user.subscription.plan

  await User.findByIdAndUpdate(user._id, {
    'subscription.status': isActive ? 'active' : subscription.status,
    'subscription.currentPeriodEnd': new Date(subscription.current_period_end * 1000),
    'subscription.plan': plan,
  })

  logger.info(`Subscription ${subscription.id} updated for user ${user._id} — status: ${subscription.status}`)
}

// ─── Gelato Webhook ──────────────────────────────────────────────────────────

exports.handleGelato = asyncHandler(async (req, res) => {
  // Verify Gelato webhook secret header
  const secret = req.headers['x-gelato-webhook-secret'] || req.headers['x-webhook-secret']
  if (secret !== process.env.GELATO_WEBHOOK_SECRET) {
    logger.warn('Gelato webhook secret mismatch')
    return res.status(401).json({ error: 'Unauthorized' })
  }

  let payload
  try {
    payload = JSON.parse(req.body.toString())
  } catch {
    return res.status(400).json({ error: 'Invalid JSON payload' })
  }

  logger.info(`Gelato event: ${payload.event} — order: ${payload.order?.id}`)

  const gelatoOrderId = payload.order?.id || payload.id
  if (!gelatoOrderId) return res.json({ received: true })

  const order = await Order.findOne({ 'gelato.orderId': gelatoOrderId })
  if (!order) {
    logger.warn(`No order found for Gelato order ${gelatoOrderId}`)
    return res.json({ received: true })
  }

  switch (payload.event) {
    case 'order_status_updated':
    case 'order.status_updated': {
      const gelatoStatus = payload.order?.status || payload.status
      const statusMap = {
        accepted: 'print_confirmed',
        in_production: 'print_confirmed',
        shipped: 'shipped',
        delivered: 'delivered',
        canceled: 'failed',
      }
      const newStatus = statusMap[gelatoStatus]
      if (newStatus) {
        order.status = newStatus
      }

      if (payload.order?.shipments?.[0]) {
        const shipment = payload.order.shipments[0]
        order.gelato = {
          ...order.gelato,
          trackingNumber: shipment.trackingCode,
          trackingUrl: shipment.trackingUrl,
          carrier: shipment.carrier,
          estimatedDelivery: shipment.estimatedDelivery ? new Date(shipment.estimatedDelivery) : undefined,
          status: gelatoStatus,
        }
      }

      await order.save()
      logger.info(`Order ${order._id} updated to status: ${order.status}`)

      // Notify customer on shipment (non-blocking)
      if (newStatus === 'shipped') {
        User.findById(order.userId).select('firstName email').lean()
          .then((u) => u && sendTrackingUpdate(u, order))
          .catch((err) => logger.error(`Tracking email failed for order ${order._id}: ${err.message}`))
      }
      break
    }

    default:
      logger.info(`Unhandled Gelato event: ${payload.event}`)
  }

  res.json({ received: true })
})
