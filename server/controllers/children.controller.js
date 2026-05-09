const asyncHandler = require('express-async-handler')
const ChildProfile = require('../models/ChildProfile')
const BookProject = require('../models/BookProject')
const { uploadBuffer } = require('../services/storage/cloudinaryService')
const { createApiError } = require('../utils/helpers')

exports.createChild = asyncHandler(async (req, res) => {
  const { name, age, gender, language, culture, hometown, bestFriendName, petName, favoriteColor, favoriteFood } = req.body

  if (!name || !age || !gender || !language) {
    throw createApiError('name, age, gender, and language are required', 422)
  }

  const child = await ChildProfile.create({
    userId: req.user._id,
    name: name.trim(),
    age,
    gender,
    language,
    culture,
    hometown,
    bestFriendName,
    petName,
    favoriteColor: favoriteColor || '#C9A84C',
    favoriteFood,
    photoUrl: req.body.photoUrl || '',
  })

  res.status(201).json({ success: true, child })
})

exports.getMyChildren = asyncHandler(async (req, res) => {
  const children = await ChildProfile.find({ userId: req.user._id }).sort({ createdAt: -1 }).lean()
  res.json({ success: true, children })
})

exports.getChild = asyncHandler(async (req, res) => {
  const child = await ChildProfile.findOne({ _id: req.params.id, userId: req.user._id })
  if (!child) throw createApiError('Child profile not found', 404)
  res.json({ success: true, child })
})

exports.updateChild = asyncHandler(async (req, res) => {
  const allowed = ['name', 'age', 'gender', 'language', 'culture', 'hometown', 'bestFriendName', 'petName', 'favoriteColor', 'favoriteFood']
  const updates = {}
  allowed.forEach((key) => { if (req.body[key] !== undefined) updates[key] = req.body[key] })

  const child = await ChildProfile.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    updates,
    { new: true, runValidators: true }
  )
  if (!child) throw createApiError('Child profile not found', 404)

  res.json({ success: true, child })
})

exports.deleteChild = asyncHandler(async (req, res) => {
  const child = await ChildProfile.findOne({ _id: req.params.id, userId: req.user._id })
  if (!child) throw createApiError('Child profile not found', 404)

  const bookCount = await BookProject.countDocuments({ childId: child._id })
  if (bookCount > 0) {
    throw createApiError(`Cannot delete — this child has ${bookCount} book(s). Delete the books first.`, 409)
  }

  await child.deleteOne()
  res.json({ success: true, message: 'Child profile deleted' })
})

exports.uploadPhoto = asyncHandler(async (req, res) => {
  const child = await ChildProfile.findOne({ _id: req.params.id, userId: req.user._id })
  if (!child) throw createApiError('Child profile not found', 404)

  if (!req.file) throw createApiError('No photo file provided', 400)

  const MAX_MB = parseInt(process.env.MAX_PHOTO_SIZE_MB) || 10
  if (req.file.size > MAX_MB * 1024 * 1024) {
    throw createApiError(`Photo must be smaller than ${MAX_MB}MB`, 400)
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(req.file.mimetype)) {
    throw createApiError('Only JPG, PNG, and WEBP photos are accepted', 400)
  }

  const result = await uploadBuffer(
    req.file.buffer,
    process.env.CLOUDINARY_FOLDER_PHOTOS || 'hero-kids/child-photos',
    'image'
  )

  child.photoUrl = result.secure_url
  child.photoPublicId = result.public_id
  await child.save()

  res.json({ success: true, photoUrl: result.secure_url, child })
})
