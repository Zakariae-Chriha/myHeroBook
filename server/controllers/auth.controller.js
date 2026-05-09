const asyncHandler = require('express-async-handler')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const User = require('../models/User')
const { createApiError } = require('../utils/helpers')
const logger = require('../utils/logger')

// ─── Token helpers ────────────────────────────────────────────────────────────

const signAccessToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  })

const signRefreshToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  })

const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex')

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  path: '/',
}

const issueTokenPair = async (user, res) => {
  const accessToken = signAccessToken(user._id)
  const refreshToken = signRefreshToken(user._id)

  // Store hashed refresh token in DB
  user.refreshToken = hashToken(refreshToken)
  user.lastLoginAt = new Date()
  await user.save({ validateBeforeSave: false })

  res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS)
  return accessToken
}

// ─── Register ─────────────────────────────────────────────────────────────────

exports.register = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password } = req.body

  const existing = await User.findOne({ email })
  if (existing) throw createApiError('An account with this email already exists', 409)

  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)

  const isAdmin = adminEmails.includes(email.toLowerCase())
  const user = await User.create({ firstName, lastName, email, password, isAdmin })
  const accessToken = await issueTokenPair(user, res)

  logger.info(`New user registered: ${email}`)

  res.status(201).json({
    success: true,
    accessToken,
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      subscription: user.subscription,
      language: user.language,
      elevenLabsVoiceId: user.elevenLabsVoiceId || null,
      isAdmin: user.isAdmin || false,
    },
  })
})

// ─── Login ────────────────────────────────────────────────────────────────────

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  const user = await User.findOne({ email }).select('+password')
  if (!user) throw createApiError('Invalid email or password', 401)

  const isMatch = await user.comparePassword(password)
  if (!isMatch) throw createApiError('Invalid email or password', 401)

  const accessToken = await issueTokenPair(user, res)

  logger.info(`User logged in: ${email}`)

  res.json({
    success: true,
    accessToken,
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      subscription: user.subscription,
      language: user.language,
      elevenLabsVoiceId: user.elevenLabsVoiceId || null,
      isAdmin: user.isAdmin || false,
    },
  })
})

// ─── Logout ───────────────────────────────────────────────────────────────────

exports.logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken
  if (token) {
    const hashed = hashToken(token)
    await User.findOneAndUpdate({ refreshToken: hashed }, { $unset: { refreshToken: '' } })
  }

  res.clearCookie('refreshToken', { ...COOKIE_OPTIONS, maxAge: 0 })
  res.json({ success: true, message: 'Logged out' })
})

// ─── Refresh Token ────────────────────────────────────────────────────────────

exports.refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken
  if (!token) throw createApiError('No refresh token', 401)

  let decoded
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET)
  } catch {
    res.clearCookie('refreshToken', { ...COOKIE_OPTIONS, maxAge: 0 })
    throw createApiError('Refresh token expired or invalid — please log in again', 401)
  }

  const hashed = hashToken(token)
  const user = await User.findOne({ _id: decoded.userId, refreshToken: hashed })
  if (!user) {
    // Token reuse detected — possible theft, invalidate all sessions
    await User.findByIdAndUpdate(decoded.userId, { $unset: { refreshToken: '' } })
    res.clearCookie('refreshToken', { ...COOKIE_OPTIONS, maxAge: 0 })
    throw createApiError('Session invalid — please log in again', 401)
  }

  const accessToken = await issueTokenPair(user, res) // rotates refresh token

  res.json({ success: true, accessToken })
})

// ─── Get Me ───────────────────────────────────────────────────────────────────

exports.getMe = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
      subscription: req.user.subscription,
      language: req.user.language,
      voiceSampleUrl: req.user.voiceSampleUrl || null,
      elevenLabsVoiceId: req.user.elevenLabsVoiceId || null,
      isAdmin: req.user.isAdmin || false,
    },
  })
})

// ─── Update Profile ───────────────────────────────────────────────────────────

exports.updateProfile = asyncHandler(async (req, res) => {
  const allowed = ['firstName', 'lastName', 'language']
  const updates = {}
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) updates[key] = req.body[key]
  })

  if (!Object.keys(updates).length) {
    throw createApiError('No valid fields provided', 422)
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  })

  res.json({
    success: true,
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      subscription: user.subscription,
      language: user.language,
      voiceSampleUrl: user.voiceSampleUrl || null,
      elevenLabsVoiceId: user.elevenLabsVoiceId || null,
    },
  })
})

// ─── Forgot Password ──────────────────────────────────────────────────────────

exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body
  if (!email) throw createApiError('Email is required', 422)

  const user = await User.findOne({ email: email.toLowerCase() })

  // Always respond 200 — never leak whether email exists
  if (!user) {
    return res.json({ success: true, message: 'If that email exists, a reset link has been sent.' })
  }

  const resetToken = crypto.randomBytes(32).toString('hex')
  user.passwordResetToken = hashToken(resetToken)
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
  await user.save({ validateBeforeSave: false })

  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`

  // In development: return the URL directly so you can test without email
  if (process.env.NODE_ENV !== 'production') {
    logger.info(`[DEV] Password reset URL for ${email}: ${resetUrl}`)
    return res.json({
      success: true,
      message: 'If that email exists, a reset link has been sent.',
      resetUrl, // shown in the UI for dev testing
    })
  }

  try {
    const { sendPasswordReset } = require('../services/email/emailService')
    await sendPasswordReset(user, resetUrl)
    logger.info(`Password reset email sent to ${email}`)
  } catch (err) {
    logger.error('Failed to send password reset email:', err.message)
    // Don't fail the request — return the link as fallback in non-production too
    return res.json({
      success: true,
      message: 'If that email exists, a reset link has been sent.',
    })
  }

  res.json({ success: true, message: 'If that email exists, a reset link has been sent.' })
})

// ─── Reset Password ───────────────────────────────────────────────────────────

exports.resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body
  if (!token || !password) throw createApiError('Token and new password are required', 422)
  if (password.length < 8) throw createApiError('Password must be at least 8 characters', 422)

  const hashed = hashToken(token)
  const user = await User.findOne({
    passwordResetToken: hashed,
    passwordResetExpires: { $gt: new Date() },
  })

  if (!user) throw createApiError('Reset token is invalid or has expired', 400)

  user.password = password
  user.passwordResetToken = undefined
  user.passwordResetExpires = undefined
  user.refreshToken = undefined // invalidate all existing sessions
  await user.save()

  res.clearCookie('refreshToken', { ...COOKIE_OPTIONS, maxAge: 0 })
  logger.info(`Password reset for user: ${user.email}`)
  res.json({ success: true, message: 'Password reset successfully. Please log in.' })
})
