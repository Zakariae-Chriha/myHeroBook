const cloudinary = require('../../config/cloudinary')
const { Readable } = require('stream')

exports.uploadBuffer = async (buffer, folder, resourceType = 'image') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (error, result) => {
        if (error) return reject(error)
        resolve(result)
      }
    )
    Readable.from(buffer).pipe(uploadStream)
  })
}

exports.uploadFromUrl = async (url, folder, publicId = null) => {
  const opts = { folder }
  if (publicId) opts.public_id = publicId
  return cloudinary.uploader.upload(url, opts)
}

exports.deleteByPublicId = async (publicId) => {
  return cloudinary.uploader.destroy(publicId)
}
