const mongoose = require('mongoose')
const logger = require('../utils/logger')

let isConnected = false

async function connectDB() {
  if (isConnected) return

  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI environment variable is required')

  try {
    await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    })
    isConnected = true
    logger.info('MongoDB connected')

    mongoose.connection.on('disconnected', () => {
      isConnected = false
      logger.warn('MongoDB disconnected')
    })
  } catch (err) {
    logger.error('MongoDB connection failed:', err)
    process.exit(1)
  }
}

module.exports = connectDB
