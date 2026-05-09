// Storage backed by Cloudinary instead of AWS S3
// Maintains the same function signatures so no other files need to change
const cloudinary = require('../../config/cloudinary')
const { Readable } = require('stream')
const fs = require('fs')
const path = require('path')

async function uploadBuffer(buffer, folder, resourceType) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (err, result) => (err ? reject(err) : resolve(result))
    )
    Readable.from(buffer).pipe(stream)
  })
}

// Upload PDF to Cloudinary using 'video' resource type (100 MB limit vs 10 MB for 'raw').
// Falls back to local disk if Cloudinary upload fails.
exports.uploadPdf = async (buffer, key) => {
  try {
    const result = await uploadBuffer(buffer, 'hero-books/pdfs', 'video')
    return result.secure_url
  } catch (cloudinaryErr) {
    // Fallback: save locally and serve from Express
    const pdfDir = path.join(__dirname, '../../temp/pdfs')
    fs.mkdirSync(pdfDir, { recursive: true })
    const filename = key.replace(/\//g, '_').replace(/[^a-z0-9_.-]/gi, '_') + '.pdf'
    const filepath = path.join(pdfDir, filename)
    fs.writeFileSync(filepath, buffer)
    return `/api/pdfs/${filename}`
  }
}

exports.uploadAudio = async (buffer, key) => {
  const folder = `hero-books/audio`
  const result = await uploadBuffer(buffer, folder, 'video')
  return result.secure_url
}

// With Cloudinary public URLs, the URL is the key — just return it directly
exports.getSignedDownloadUrl = async (bucket, key, expiresInSeconds = 604800) => {
  return key
}
