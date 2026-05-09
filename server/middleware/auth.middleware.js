const jwt = require('jsonwebtoken')
const asyncHandler = require('express-async-handler')
const User = require('../models/User')

exports.authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401)
    throw new Error('Authentication required — no token provided')
  }

  const token = authHeader.split(' ')[1]

  let decoded
  try {
    decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET)
  } catch (err) {
    res.status(401)
    throw new Error(
      err.name === 'TokenExpiredError'
        ? 'Access token expired — please refresh'
        : 'Invalid access token'
    )
  }

  const user = await User.findById(decoded.userId).select(
    '-password -refreshToken -passwordResetToken -passwordResetExpires'
  )
  if (!user) {
    res.status(401)
    throw new Error('User account not found')
  }

  req.user = user
  next()
})

exports.requireAdmin = (req, res, next) => {
  if (!req.user?.isAdmin) {
    res.status(403)
    throw new Error('Admin access required')
  }
  next()
}

// Optional auth — attaches user if token present but does not block anonymous requests
exports.optionalAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return next()

  try {
    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET)
    const user = await User.findById(decoded.userId).select(
      '-password -refreshToken -passwordResetToken -passwordResetExpires'
    )
    if (user) req.user = user
  } catch {
    // Silently ignore — optional auth
  }
  next()
})
