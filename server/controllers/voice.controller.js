const asyncHandler = require('express-async-handler')
const axios = require('axios')
const FormData = require('form-data')
const User = require('../models/User')
const { uploadBuffer } = require('../services/storage/cloudinaryService')
const { createApiError } = require('../utils/helpers')

const ELEVEN_BASE = 'https://api.elevenlabs.io/v1'

exports.uploadSample = asyncHandler(async (req, res) => {
  if (!req.file) throw createApiError('No audio file provided', 400)

  const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg', 'audio/mp4']
  if (!allowedTypes.includes(req.file.mimetype)) {
    throw createApiError('Audio must be MP3, WAV, WEBM, OGG, or MP4', 400)
  }

  // Upload sample to Cloudinary for storage
  const cloudResult = await uploadBuffer(
    req.file.buffer,
    'hero-kids/voice-samples',
    'video' // Cloudinary uses 'video' resource type for audio
  )

  // Clone voice via ElevenLabs
  const form = new FormData()
  form.append('name', `${req.user.firstName} ${req.user.lastName} — ${Date.now()}`)
  form.append('description', `Parent voice for Hero Kids StoryLab — ${req.user.email}`)
  form.append('files', req.file.buffer, {
    filename: `voice-sample.${req.file.mimetype.split('/')[1]}`,
    contentType: req.file.mimetype,
  })
  form.append('labels', JSON.stringify({ use: 'hero-kids-parent' }))

  const { data } = await axios.post(`${ELEVEN_BASE}/voices/add`, form, {
    headers: {
      'xi-api-key': process.env.ELEVENLABS_API_KEY,
      ...form.getHeaders(),
    },
    timeout: 60_000,
  })

  await User.findByIdAndUpdate(req.user._id, {
    voiceSampleUrl: cloudResult.secure_url,
    elevenLabsVoiceId: data.voice_id,
  })

  res.json({
    success: true,
    voiceId: data.voice_id,
    message: 'Voice cloned successfully — ready for book narration',
  })
})

exports.getStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('voiceSampleUrl elevenLabsVoiceId').lean()

  const hasVoice = Boolean(user.elevenLabsVoiceId)

  // If voice exists, verify it's still active on ElevenLabs
  if (hasVoice) {
    try {
      await axios.get(`${ELEVEN_BASE}/voices/${user.elevenLabsVoiceId}`, {
        headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY },
        timeout: 8_000,
      })
    } catch {
      // Voice was deleted on ElevenLabs — clear our record
      await User.findByIdAndUpdate(req.user._id, {
        $unset: { elevenLabsVoiceId: '', voiceSampleUrl: '' },
      })
      return res.json({ success: true, hasVoice: false, voiceId: null })
    }
  }

  res.json({
    success: true,
    hasVoice,
    voiceId: user.elevenLabsVoiceId || null,
    sampleUrl: user.voiceSampleUrl || null,
  })
})
