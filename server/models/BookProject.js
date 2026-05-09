const mongoose = require('mongoose')

const bookPageSchema = new mongoose.Schema(
  {
    pageNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
    },
    text: {
      type: String,
      required: true,
    },
    imagePrompt: String,
    imageUrl: String,
    imagePublicId: String,
    audioUrl: String,
    audioS3Key: String,
    qrCodeUrl: String,
    qrCodePublicId: String,
  },
  { _id: false }
)

const storySchema = new mongoose.Schema(
  {
    fullText: String,
    pages: [bookPageSchema],
  },
  { _id: false }
)

const generationProgressSchema = new mongoose.Schema(
  {
    storyDone: { type: Boolean, default: false },
    imagesCompleted: { type: Number, default: 0, min: 0 },
    voiceCompleted: { type: Number, default: 0, min: 0 },
    pdfDone: { type: Boolean, default: false },
  },
  { _id: false }
)

const bookProjectSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    childId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChildProfile',
      required: [true, 'Child profile reference is required'],
    },
    seriesId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BookSeries',
    },
    episodeNumber: {
      type: Number,
      default: 1,
      min: 1,
    },
    chosenJob: {
      type: String,
      required: [true, 'Dream job selection is required'],
      trim: true,
    },
    artStyle: {
      type: String,
      enum: ['watercolor', 'comic', 'storybook'],
      default: 'watercolor',
    },
    storyTheme: {
      type: String,
      enum: [
        'save-the-world',
        'magic-quest',
        'ocean-journey',
        'mountain-hero',
        'city-adventure',
        'space-mission',
      ],
      default: 'save-the-world',
    },
    title: {
      type: String,
      trim: true,
    },
    dedication: {
      type: String,
      trim: true,
      maxlength: [500, 'Dedication must be less than 500 characters'],
    },
    story: {
      type: storySchema,
      default: () => ({ pages: [] }),
    },
    status: {
      type: String,
      enum: [
        'draft',
        'generating_story',
        'generating_images',
        'generating_voice',
        'assembling_pdf',
        'ready',
        'failed',
      ],
      default: 'draft',
      index: true,
    },
    failureReason: String,
    pdfUrl: String,
    pdfS3Key: String,
    tier: {
      type: String,
      enum: ['digital', 'printed', 'voice'],
    },
    language: {
      type: String,
      default: 'en',
    },
    generationProgress: {
      type: generationProgressSchema,
      default: () => ({
        storyDone: false,
        imagesCompleted: 0,
        voiceCompleted: 0,
        pdfDone: false,
      }),
    },
    jobId: String,
    coverPageIndex: {
      type: Number,
      default: 0,
      min: 0,
    },
    isGift: {
      type: Boolean,
      default: false,
    },
    giftRecipient: {
      type: String,
      trim: true,
      maxlength: 100,
    },
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

bookProjectSchema.index({ userId: 1, createdAt: -1 })
bookProjectSchema.index({ userId: 1, status: 1 })
bookProjectSchema.index({ childId: 1 })
bookProjectSchema.index({ seriesId: 1 })
bookProjectSchema.index({ status: 1, createdAt: -1 })

bookProjectSchema.virtual('progressPercentage').get(function () {
  const p = this.generationProgress
  if (!p) return 0
  let total = 0
  if (p.storyDone) total += 10
  const totalPages = this.story?.pages?.length || 16
  total += Math.min(p.imagesCompleted / totalPages, 1) * 60
  if (p.voiceCompleted > 0) total += Math.min(p.voiceCompleted / totalPages, 1) * 20
  if (p.pdfDone) total += 10
  return Math.min(Math.round(total), 100)
})

bookProjectSchema.virtual('isReady').get(function () {
  return this.status === 'ready'
})

bookProjectSchema.virtual('isFailed').get(function () {
  return this.status === 'failed'
})

bookProjectSchema.methods.updateProgress = async function (field, value) {
  this.generationProgress[field] = value
  this.markModified('generationProgress')
  return this.save()
}

module.exports = mongoose.model('BookProject', bookProjectSchema)
