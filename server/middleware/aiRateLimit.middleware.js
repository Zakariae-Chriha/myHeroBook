const rateLimit = require('express-rate-limit')

module.exports = rateLimit({
  windowMs: parseInt(process.env.AI_RATE_LIMIT_WINDOW_MS) || 3600000,
  max: parseInt(process.env.AI_RATE_LIMIT_MAX_REQUESTS) || 5,
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many AI generation requests. Please wait before trying again.' },
})
