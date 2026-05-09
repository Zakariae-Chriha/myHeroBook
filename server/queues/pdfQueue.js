// Full implementation in STEP 9
const Bull = require('bull')
const { createRedisClient } = require('../config/redis')

const pdfQueue = new Bull('pdf-assembly', {
  createClient: (type) => createRedisClient(),
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'fixed', delay: 5000 },
    removeOnComplete: 50,
    removeOnFail: 25,
  },
})

module.exports = pdfQueue
