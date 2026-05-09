const { v4: uuidv4 } = require('uuid')

exports.generateId = () => uuidv4()

exports.generateBookKey = (userId, bookId) => `books/${userId}/${bookId}/book.pdf`

exports.generateAudioKey = (userId, bookId, pageNumber) =>
  `audio/${userId}/${bookId}/page-${pageNumber}.mp3`

exports.sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

exports.chunk = (arr, size) => {
  const chunks = []
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size))
  return chunks
}

exports.createApiError = (message, statusCode = 400) => {
  const err = new Error(message)
  err.statusCode = statusCode
  return err
}
