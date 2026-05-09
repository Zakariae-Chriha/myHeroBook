const logger = require('../../utils/logger')
const crypto = require('crypto')
const { uploadBuffer } = require('../storage/cloudinaryService')

// ── Art style descriptors ──────────────────────────────────────────────────────
const ART_STYLE = {
  watercolor: {
    positive: [
      'stunning watercolor illustration for children\'s picture book',
      'soft luminous washes of color over delicate pencil sketch',
      'translucent layered watercolor paint',
      'warm pastel tones gentle gradients',
      'whimsical magical cozy atmosphere',
      'award-winning picture book illustration',
      'professional children\'s book artist',
      'beautiful rich detail',
    ].join(', '),
    negative: 'text, words, letters, numbers, watermark, logo, photorealistic, 3d render, photo, CGI, dark, scary, horror, violent, blood, adult, ugly, deformed, blurry, low quality, pixelated, noise, overexposed, flat, dull',
  },
  comic: {
    positive: [
      'vibrant children\'s comic book illustration',
      'bold confident ink outlines',
      'bright saturated flat colors cel shading',
      'dynamic exciting composition',
      'clean graphic style professional comic artist',
      'energetic joyful atmosphere sharp lines',
    ].join(', '),
    negative: 'text, words, letters, speech bubbles, watermark, realistic photo, dark, violent, scary, adult, ugly, deformed, blurry, muddy colors, low quality',
  },
  storybook: {
    positive: [
      'classic fairy-tale storybook illustration',
      'detailed pen-and-ink with rich warm color wash',
      'golden hour lighting depth atmosphere',
      'whimsical detailed magical environments',
      'cozy enchanting classic children\'s book',
      'master illustrator quality cinematic composition',
    ].join(', '),
    negative: 'text, words, letters, watermark, logo, modern digital, cold palette, dark, violent, scary, adult, ugly, deformed, blurry, low quality',
  },
}

function pageSeed(bookId, pageNumber) {
  return parseInt(
    crypto.createHash('md5').update(`${bookId}-page-${pageNumber}`).digest('hex').slice(0, 8),
    16,
  ) % 2147483647
}

async function downloadAndUpload(buffer, bookId, pageNumber, label) {
  if (buffer.length < 5000) throw new Error(`${label} returned empty image`)
  const result = await uploadBuffer(buffer, `hero-books/${bookId}/pages`, 'image')
  logger.info(`[imageService] ✓ ${label} page ${pageNumber} — ${(buffer.length / 1024).toFixed(0)}KB → Cloudinary`)
  return result.secure_url
}

async function fetchAndUpload(imageUrl, bookId, pageNumber, label) {
  const res = await fetch(imageUrl, { signal: AbortSignal.timeout(60000) })
  if (!res.ok) throw new Error(`${label} download failed: ${res.status}`)
  const buffer = Buffer.from(await res.arrayBuffer())
  return downloadAndUpload(buffer, bookId, pageNumber, label)
}

// ── 1. HuggingFace FLUX.1-dev — free, high quality ────────────────────────────
async function generateWithHuggingFace(imagePrompt, artStyle, bookId, pageNumber) {
  const hfToken = process.env.HUGGINGFACE_API_TOKEN
  if (!hfToken) throw new Error('No HuggingFace token')

  const style = ART_STYLE[artStyle] || ART_STYLE.watercolor
  const prompt = `${imagePrompt}, ${style.positive}, no text, no letters, no words`

  // Try FLUX.1-dev first (better quality), fallback to schnell
  const models = [
    'black-forest-labs/FLUX.1-dev',
    'black-forest-labs/FLUX.1-schnell',
  ]

  for (const model of models) {
    try {
      logger.info(`[imageService] HuggingFace ${model} page ${pageNumber}`)
      const res = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${hfToken}`,
          'Content-Type': 'application/json',
          'x-wait-for-model': 'true',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            width: 1024,
            height: 1024,
            num_inference_steps: model.includes('dev') ? 28 : 4,
            guidance_scale: model.includes('dev') ? 3.5 : 0,
            seed: pageSeed(bookId, pageNumber),
          },
        }),
        signal: AbortSignal.timeout(120000),
      })

      if (res.status === 503) {
        // Model loading — wait and retry
        logger.info(`[imageService] HF model loading, waiting 20s...`)
        await new Promise((r) => setTimeout(r, 20000))
        continue
      }

      if (res.status === 429) throw Object.assign(new Error('HuggingFace rate limited'), { status: 429 })
      if (!res.ok) {
        const err = await res.text()
        throw new Error(`HuggingFace HTTP ${res.status}: ${err.slice(0, 100)}`)
      }

      const buffer = Buffer.from(await res.arrayBuffer())
      return await downloadAndUpload(buffer, bookId, pageNumber, `HF-${model.split('/')[1]}`)
    } catch (err) {
      if (err.status === 429) throw err
      logger.warn(`[imageService] HF ${model} failed page ${pageNumber}: ${err.message}`)
      if (model === models[models.length - 1]) throw err
    }
  }
}

// ── 2. Pollinations FLUX — free fallback ──────────────────────────────────────
async function generateWithPollinations(imagePrompt, artStyle, bookId, pageNumber) {
  const style = ART_STYLE[artStyle] || ART_STYLE.watercolor
  const seed = pageSeed(bookId, pageNumber) % 1000000

  const fullPrompt = `${imagePrompt}, ${style.positive}, no text overlay, no words, no letters`
  let encoded = encodeURIComponent(fullPrompt)
  let prompt = fullPrompt
  while (encoded.length > 480 && prompt.length > 50) {
    prompt = prompt.slice(0, -10)
    encoded = encodeURIComponent(prompt)
  }

  const negEncoded = encodeURIComponent(style.negative)
  const url = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&model=flux&nologo=true&enhance=true&seed=${seed}&negative=${negEncoded}`

  logger.info(`[imageService] Pollinations page ${pageNumber}`)
  const res = await fetch(url, { signal: AbortSignal.timeout(90000) })
  if (res.status === 429) throw Object.assign(new Error('Pollinations rate limited'), { status: 429 })
  if (!res.ok) throw new Error(`Pollinations HTTP ${res.status}`)

  const buffer = Buffer.from(await res.arrayBuffer())
  if (buffer.length < 5000) throw new Error('Pollinations empty image')

  try {
    const result = await uploadBuffer(buffer, `hero-books/${bookId}/pages`, 'image')
    logger.info(`[imageService] ✓ Pollinations page ${pageNumber} → Cloudinary`)
    return result.secure_url
  } catch {
    return url
  }
}

// ── 3. Replicate consistent-character — real child face (when credit) ──────────
async function generateWithFaceConsistent(imagePrompt, childPhotoUrl, artStyle, bookId, pageNumber) {
  const Replicate = require('replicate')
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })
  const style = ART_STYLE[artStyle] || ART_STYLE.watercolor

  const output = await replicate.run('fofr/consistent-character', {
    input: {
      subject: childPhotoUrl,
      prompt: `${imagePrompt}, ${style.positive.split(',').slice(0, 5).join(',')}, children's book illustration, no text`,
      negative_prompt: style.negative,
      output_format: 'png',
      output_quality: 90,
      randomise_poses: true,
      number_of_outputs: 1,
      number_of_images_per_pose: 1,
    },
  })

  const urls = Array.isArray(output) ? output : [output]
  const url = String(urls[0])
  if (!url || url === 'null') throw new Error('consistent-character returned no URL')
  return fetchAndUpload(url, bookId, pageNumber, 'FaceGen')
}

// ── Main export ────────────────────────────────────────────────────────────────
exports.generatePageImage = async function (imagePrompt, childPhotoUrl, artStyle, bookId, pageNumber) {
  logger.info(`[imageService] Page ${pageNumber} — face=${Boolean(childPhotoUrl)} style=${artStyle}`)

  const hasPhoto = Boolean(childPhotoUrl && childPhotoUrl.startsWith('http'))
  const hasReplicate = Boolean(process.env.REPLICATE_API_TOKEN)

  // ── Step 1: Face-consistent (only if Replicate has credit + child photo) ────
  if (hasReplicate && hasPhoto) {
    try {
      return await Promise.race([
        generateWithFaceConsistent(imagePrompt, childPhotoUrl, artStyle, bookId, pageNumber),
        new Promise((_, reject) => setTimeout(() => reject(new Error('FaceGen timeout')), 120000)),
      ])
    } catch (err) {
      logger.warn(`[imageService] FaceGen failed page ${pageNumber}: ${err.message}`)
    }
  }

  // ── Step 2: Pollinations FLUX — free, good quality ────────────────────────
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await generateWithPollinations(imagePrompt, artStyle, bookId, pageNumber)
    } catch (err) {
      if (attempt < 3) {
        await new Promise((r) => setTimeout(r, attempt * 3000))
        continue
      }
      logger.warn(`[imageService] Pollinations failed page ${pageNumber}: ${err.message}`)
    }
  }

  // ── Step 4: Raw Pollinations URL fallback ──────────────────────────────────
  const style = ART_STYLE[artStyle] || ART_STYLE.watercolor
  const seed = pageSeed(bookId, pageNumber) % 1000000
  const fallback = `https://image.pollinations.ai/prompt/${encodeURIComponent(`${imagePrompt}, ${style.positive.split(',').slice(0, 3).join(',')}, no text`)}?width=1024&height=1024&model=flux&nologo=true&seed=${seed}`
  logger.warn(`[imageService] All providers failed page ${pageNumber} — raw URL fallback`)
  return fallback
}
