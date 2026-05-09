// Full implementation in STEP 12
const Bull = require('bull')
const { createRedisClient } = require('../config/redis')

const voiceQueue = new Bull('voice-generation', {
  createClient: (type) => createRedisClient(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 50,
    removeOnFail: 25,
  },
})

module.exports = voiceQueue
