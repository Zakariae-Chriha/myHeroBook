const Redis = require('ioredis')
const logger = require('../utils/logger')

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy: (times) => Math.min(times * 100, 3000),
  ...(process.env.REDIS_TLS === 'true' && { tls: {} }),
}

const redis = new Redis(redisConfig)

redis.on('connect', () => logger.info('Redis connected'))
redis.on('error', (err) => logger.error('Redis error:', JSON.stringify({ code: err.code })))

const createRedisClient = () => new Redis(redisConfig)

module.exports = { redis, createRedisClient }
