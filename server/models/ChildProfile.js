const mongoose = require('mongoose')

const illustratedVersionSchema = new mongoose.Schema(
  {
    style: {
      type: String,
      enum: ['watercolor', 'comic', 'storybook'],
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
)

const childProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, "Child's name is required"],
      trim: true,
      minlength: [1, 'Name must be at least 1 character'],
      maxlength: [50, 'Name must be less than 50 characters'],
    },
    age: {
      type: Number,
      required: [true, "Child's age is required"],
      min: [1, 'Age must be at least 1'],
      max: [12, 'Age must be at most 12'],
    },
    gender: {
      type: String,
      enum: {
        values: ['boy', 'girl', 'other'],
        message: 'Gender must be boy, girl, or other',
      },
      required: [true, 'Gender is required'],
    },
    photoUrl: {
      type: String,
      default: '',
    },
    photoPublicId: String,
    illustratedVersions: [illustratedVersionSchema],
    language: {
      type: String,
      required: [true, 'Language is required'],
      default: 'en',
    },
    culture: {
      type: String,
      trim: true,
    },
    hometown: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    bestFriendName: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    petName: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    favoriteColor: {
      type: String,
      trim: true,
      default: '#C9A84C',
    },
    favoriteFood: {
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

childProfileSchema.index({ userId: 1, createdAt: -1 })

childProfileSchema.virtual('books', {
  ref: 'BookProject',
  localField: '_id',
  foreignField: 'childId',
})

childProfileSchema.methods.getIllustratedVersion = function (style) {
  return this.illustratedVersions.find((v) => v.style === style) || null
}

module.exports = mongoose.model('ChildProfile', childProfileSchema)
