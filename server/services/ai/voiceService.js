const axios = require('axios')
const logger = require('../../utils/logger')

const ELEVEN_BASE = 'https://api.elevenlabs.io/v1'
const MODEL_ID = process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2'
const OUTPUT_FORMAT = 'mp3_44100_128' // 44.1 kHz, 128 kbps — good quality for narration

function apiHeaders() {
  return {
    'xi-api-key': process.env.ELEVENLABS_API_KEY,
    'Content-Type': 'application/json',
  }
}

/**
 * Synthesize a single page of text using a cloned voice.
 *
 * @param {string} voiceId  - ElevenLabs voice ID (from user.elevenLabsVoiceId)
 * @param {string} text     - Story text for this page
 * @returns {Buffer}        - MP3 audio buffer
 */
async function synthesizePage(voiceId, text) {
  logger.info(`[voiceService] Synthesizing ${text.length} chars with voice ${voiceId}`)
  const startTime = Date.now()

  const response = await axios.post(
    `${ELEVEN_BASE}/text-to-speech/${voiceId}`,
    {
      text,
      model_id: MODEL_ID,
      voice_settings: {
        stability: parseFloat(process.env.ELEVENLABS_STABILITY) || 0.5,
        similarity_boost: parseFloat(process.env.ELEVENLABS_SIMILARITY) || 0.75,
        style: 0.0,
        use_speaker_boost: true,
      },
    },
    {
      headers: { ...apiHeaders(), Accept: 'audio/mpeg' },
      params: { output_format: OUTPUT_FORMAT },
      responseType: 'arraybuffer',
      timeout: 90_000,
    }
  )

  const buffer = Buffer.from(response.data)
  logger.info(`[voiceService] Page synthesized in ${Date.now() - startTime}ms — ${Math.round(buffer.length / 1024)} KB`)
  return buffer
}

// Exported with retry wrapper — backs off on rate-limit and server errors
exports.synthesizePage = async function (voiceId, text) {
  const MAX_ATTEMPTS = 3

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await synthesizePage(voiceId, text)
    } catch (err) {
      const status = err.response?.status
      const isLast = attempt === MAX_ATTEMPTS
      const isRetryable = status === 429 || status === 503 || status === 500 || !status

      logger.warn(`[voiceService] Attempt ${attempt} failed (HTTP ${status || 'network'}): ${err.message}`)

      if (isLast || !isRetryable) {
        const detail = err.response?.data
          ? Buffer.from(err.response.data).toString('utf8').slice(0, 200)
          : err.message
        throw new Error(`ElevenLabs TTS failed (HTTP ${status}): ${detail}`)
      }

      const delay = Math.pow(2, attempt) * 4000 // 8s, 16s
      logger.info(`[voiceService] Retrying in ${delay}ms…`)
      await new Promise((r) => setTimeout(r, delay))
    }
  }
}

/**
 * Clone a voice from an audio sample buffer.
 * Called from voice.controller.js; kept here for co-location.
 *
 * @param {Buffer} audioBuffer  - Raw audio file buffer
 * @param {string} label        - Human-readable name for the voice
 * @returns {string}            - New ElevenLabs voice ID
 */
exports.cloneVoice = async function cloneVoice(audioBuffer, label) {
  const FormData = require('form-data')
  const form = new FormData()
  form.append('name', label)
  form.append('description', `Parent voice — Hero Kids StoryLab`)
  form.append('files', audioBuffer, { filename: 'voice-sample.mp3', contentType: 'audio/mpeg' })
  form.append('labels', JSON.stringify({ use: 'hero-kids-parent' }))

  const { data } = await axios.post(`${ELEVEN_BASE}/voices/add`, form, {
    headers: {
      'xi-api-key': process.env.ELEVENLABS_API_KEY,
      ...form.getHeaders(),
    },
    timeout: 60_000,
  })

  if (!data.voice_id) throw new Error('ElevenLabs returned no voice_id')
  return data.voice_id
}
