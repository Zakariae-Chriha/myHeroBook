require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') })
const http = require('http')
const app = require('./app')
const connectDB = require('./config/db')
const logger = require('./utils/logger')

const PORT = process.env.PORT || 5000

async function bootstrap() {
  await connectDB()

  const server = http.createServer(app)

  server.listen(PORT, () => {
    logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
  })

  const shutdown = (signal) => {
    logger.info(`${signal} received — shutting down gracefully`)
    server.close(() => {
      logger.info('HTTP server closed')
      process.exit(0)
    })
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))

  process.on('unhandledRejection', (err) => {
    logger.error('Unhandled rejection:', err)
    server.close(() => process.exit(1))
  })
}

bootstrap()
