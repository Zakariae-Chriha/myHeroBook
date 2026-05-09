const mongoose = require('mongoose')

const episodeSchema = new mongoose.Schema(
  {
    episodeNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BookProject',
      required: true,
    },
    title: String,
    job: String,
    coverImageUrl: String,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
)

const bookSeriesSchema = new mongoose.Schema(
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
      index: true,
    },
    universeName: {
      type: String,
      trim: true,
    },
    episodes: [episodeSchema],
    totalEpisodes: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
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

bookSeriesSchema.index({ userId: 1, childId: 1 }, { unique: true })

bookSeriesSchema.pre('save', function (next) {
  this.totalEpisodes = this.episodes.length
  this.lastUpdated = new Date()
  next()
})

bookSeriesSchema.methods.addEpisode = async function (bookProject) {
  const nextNumber = this.totalEpisodes + 1
  this.episodes.push({
    episodeNumber: nextNumber,
    bookId: bookProject._id,
    title: bookProject.title,
    job: bookProject.chosenJob,
    coverImageUrl: bookProject.story?.pages?.[0]?.imageUrl || null,
    createdAt: new Date(),
  })
  return this.save()
}

bookSeriesSchema.methods.getNextEpisodeNumber = function () {
  return this.totalEpisodes + 1
}

bookSeriesSchema.statics.findOrCreateForChild = async function (userId, childId, childName) {
  let series = await this.findOne({ userId, childId })
  if (!series) {
    series = await this.create({
      userId,
      childId,
      universeName: `${childName}'s Hero Universe`,
      episodes: [],
    })
  }
  return series
}

module.exports = mongoose.model('BookSeries', bookSeriesSchema)
