const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const subscriptionSchema = new mongoose.Schema(
  {
    plan: {
      type: String,
      enum: ['free', 'monthly', 'yearly'],
      default: 'free',
    },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'expired'],
    },
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    currentPeriodEnd: Date,
    booksRemaining: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
)

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    subscription: {
      type: subscriptionSchema,
      default: () => ({ plan: 'free', booksRemaining: 0 }),
    },
    voiceSampleUrl: String,
    elevenLabsVoiceId: String,
    language: {
      type: String,
      default: 'en',
    },
    refreshToken: {
      type: String,
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    lastLoginAt: Date,
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, obj) => {
        delete obj.password
        delete obj.refreshToken
        delete obj.passwordResetToken
        delete obj.passwordResetExpires
        delete obj.__v
        return obj
      },
    },
  }
)

userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`
})

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, parseInt(process.env.BCRYPT_ROUNDS) || 12)
  next()
})

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password)
}

userSchema.methods.hasActiveSubscription = function () {
  return (
    this.subscription.status === 'active' &&
    this.subscription.currentPeriodEnd > new Date()
  )
}

userSchema.methods.canCreateBook = function () {
  if (this.hasActiveSubscription()) return true
  return this.subscription.booksRemaining > 0
}

module.exports = mongoose.model('User', userSchema)
