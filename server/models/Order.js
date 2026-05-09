const mongoose = require('mongoose')

const stripeInfoSchema = new mongoose.Schema(
  {
    paymentIntentId: String,
    sessionId: String,
    receiptUrl: String,
    chargeId: String,
  },
  { _id: false }
)

const gelatoInfoSchema = new mongoose.Schema(
  {
    orderId: String,
    referenceId: String,
    trackingNumber: String,
    trackingUrl: String,
    carrier: String,
    estimatedDelivery: Date,
    status: String,
  },
  { _id: false }
)

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    line1: {
      type: String,
      required: true,
      trim: true,
    },
    line2: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    postalCode: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 2,
    },
    phone: String,
  },
  { _id: false }
)

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BookProject',
      required: [true, 'Book reference is required'],
    },
    tier: {
      type: String,
      enum: {
        values: ['digital', 'printed', 'voice'],
        message: 'Tier must be digital, printed, or voice',
      },
      required: [true, 'Product tier is required'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    currency: {
      type: String,
      default: 'eur',
      lowercase: true,
    },
    addons: [
      {
        type: {
          type: String,
          enum: ['rush_printing', 'extra_copy', 'gift_wrap', 'voice_addon'],
        },
        price: Number,
      },
    ],
    status: {
      type: String,
      enum: [
        'pending',
        'paid',
        'generating',
        'print_submitted',
        'print_confirmed',
        'shipped',
        'delivered',
        'failed',
        'refunded',
      ],
      default: 'pending',
      index: true,
    },
    stripe: stripeInfoSchema,
    gelato: gelatoInfoSchema,
    shippingAddress: shippingAddressSchema,
    downloadUrl: String,
    downloadS3Key: String,
    downloadExpiresAt: Date,
    refundedAt: Date,
    refundReason: String,
    notes: String,
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, obj) => {
        delete obj.__v
        return obj
      },
    },
  }
)

orderSchema.index({ userId: 1, createdAt: -1 })
orderSchema.index({ bookId: 1 })
orderSchema.index({ bookId: 1, status: 1 })
orderSchema.index({ 'stripe.sessionId': 1 }, { sparse: true })
orderSchema.index({ 'stripe.paymentIntentId': 1 }, { sparse: true })
orderSchema.index({ 'gelato.orderId': 1 }, { sparse: true })

orderSchema.virtual('totalWithAddons').get(function () {
  const addonTotal = (this.addons || []).reduce((sum, a) => sum + (a.price || 0), 0)
  return this.price + addonTotal
})

orderSchema.virtual('isPaid').get(function () {
  return ['paid', 'generating', 'print_submitted', 'print_confirmed', 'shipped', 'delivered'].includes(
    this.status
  )
})

orderSchema.virtual('needsPrinting').get(function () {
  return ['printed', 'voice'].includes(this.tier)
})

orderSchema.virtual('isDownloadReady').get(function () {
  return this.downloadUrl && this.downloadExpiresAt > new Date()
})

orderSchema.methods.markPaid = async function (stripeData) {
  this.status = 'paid'
  this.stripe = { ...this.stripe, ...stripeData }
  return this.save()
}

orderSchema.methods.markShipped = async function (gelatoData) {
  this.status = 'shipped'
  this.gelato = { ...this.gelato, ...gelatoData }
  return this.save()
}

module.exports = mongoose.model('Order', orderSchema)
