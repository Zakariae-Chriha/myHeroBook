// Full implementation in STEP 8
const Bull = require('bull')
const { createRedisClient } = require('../config/redis')

const imageQueue = new Bull('image-generation', {
  createClient: (type) => {
    switch (type) {
      case 'client': return createRedisClient()
      case 'subscriber': return createRedisClient()
      case 'bclient': return createRedisClient()
      default: return createRedisClient()
    }
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'fixed', delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
})

module.exports = imageQueue
