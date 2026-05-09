const Joi = require('joi')

exports.validateBody = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true })
  if (error) {
    const messages = error.details.map((d) => d.message.replace(/['"]/g, '')).join(', ')
    return res.status(422).json({ success: false, message: messages })
  }
  req.body = value // use stripped/coerced values
  next()
}

// ─── Auth schemas ─────────────────────────────────────────────────────────────

exports.registerSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(50).required().messages({
    'string.min': 'First name must be at least 2 characters',
    'any.required': 'First name is required',
  }),
  lastName: Joi.string().trim().min(2).max(50).required().messages({
    'string.min': 'Last name must be at least 2 characters',
    'any.required': 'Last name is required',
  }),
  email: Joi.string().email().lowercase().required().messages({
    'string.email': 'Please enter a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(8).max(128).required().messages({
    'string.min': 'Password must be at least 8 characters',
    'any.required': 'Password is required',
  }),
})

exports.loginSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().required(),
})

// ─── Child schemas ────────────────────────────────────────────────────────────

exports.createChildSchema = Joi.object({
  name: Joi.string().trim().min(1).max(50).required(),
  age: Joi.number().integer().min(1).max(12).required(),
  gender: Joi.string().valid('boy', 'girl', 'other').required(),
  language: Joi.string().min(2).max(10).required(),
  culture: Joi.string().trim().max(100).allow('', null),
  hometown: Joi.string().trim().max(100).allow('', null),
  bestFriendName: Joi.string().trim().max(50).allow('', null),
  petName: Joi.string().trim().max(50).allow('', null),
  favoriteColor: Joi.string().max(20).allow('', null),
  favoriteFood: Joi.string().trim().max(100).allow('', null),
  photoUrl: Joi.string().uri().allow('', null),
})

// ─── Book schemas ─────────────────────────────────────────────────────────────

exports.createBookSchema = Joi.object({
  childId: Joi.string().hex().length(24).required(),
  chosenJob: Joi.string().trim().min(2).max(100).required(),
  artStyle: Joi.string().valid('watercolor', 'comic', 'storybook').default('watercolor'),
  storyTheme: Joi.string()
    .valid('save-the-world', 'magic-quest', 'ocean-journey', 'mountain-hero', 'city-adventure', 'space-mission')
    .default('save-the-world'),
  episodeNumber: Joi.number().integer().min(1).default(1),
  dedication: Joi.string().trim().max(500).allow('', null),
  tier: Joi.string().valid('digital', 'printed', 'voice').allow(null),
  language: Joi.string().min(2).max(10).allow('', null),
})

// ─── Order schemas ────────────────────────────────────────────────────────────

exports.createCheckoutSchema = Joi.object({
  bookId: Joi.string().hex().length(24).required(),
  tier: Joi.string().valid('digital', 'printed', 'voice').required(),
  addons: Joi.array()
    .items(Joi.string().valid('rush_printing', 'extra_copy', 'gift_wrap', 'voice_addon'))
    .default([]),
  shippingAddress: Joi.object({
    fullName: Joi.string().trim().required(),
    line1: Joi.string().trim().required(),
    line2: Joi.string().trim().allow('', null),
    city: Joi.string().trim().required(),
    state: Joi.string().trim().allow('', null),
    postalCode: Joi.string().trim().required(),
    country: Joi.string().uppercase().length(2).required(),
    phone: Joi.string().allow('', null),
  }).when('tier', {
    is: Joi.string().valid('printed', 'voice'),
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
})
