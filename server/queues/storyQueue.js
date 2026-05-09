// Full implementation in STEP 7
const Bull = require('bull')
const { createRedisClient } = require('../config/redis')

const storyQueue = new Bull('story-generation', {
  createClient: (type) => createRedisClient(),
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'fixed', delay: 3000 },
    removeOnComplete: 50,
    removeOnFail: 25,
  },
})

module.exports = storyQueue
