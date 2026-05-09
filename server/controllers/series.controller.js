const asyncHandler = require('express-async-handler')
const BookSeries = require('../models/BookSeries')
const ChildProfile = require('../models/ChildProfile')
const { createApiError } = require('../utils/helpers')

exports.getMySeries = asyncHandler(async (req, res) => {
  const series = await BookSeries.find({ userId: req.user._id })
    .sort({ lastUpdated: -1 })
    .populate('childId', 'name age photoUrl')
    .populate('episodes.bookId', 'title status pdfUrl tier createdAt')
    .lean()

  res.json({ success: true, series })
})

exports.getSeries = asyncHandler(async (req, res) => {
  const series = await BookSeries.findOne({ _id: req.params.id, userId: req.user._id })
    .populate('childId', 'name age photoUrl culture language')
    .populate('episodes.bookId', 'title status pdfUrl tier chosenJob storyTheme createdAt')
    .lean()

  if (!series) throw createApiError('Series not found', 404)
  res.json({ success: true, series })
})

exports.createSeries = asyncHandler(async (req, res) => {
  const { childId, universeName } = req.body
  if (!childId) throw createApiError('childId is required', 422)

  const child = await ChildProfile.findOne({ _id: childId, userId: req.user._id })
  if (!child) throw createApiError('Child profile not found', 404)

  const existing = await BookSeries.findOne({ userId: req.user._id, childId: child._id })
  if (existing) return res.json({ success: true, series: existing })

  const series = await BookSeries.create({
    userId: req.user._id,
    childId: child._id,
    universeName: universeName || `${child.name}'s Hero Universe`,
    episodes: [],
  })

  res.status(201).json({ success: true, series })
})
