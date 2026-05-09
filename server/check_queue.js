require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') })
require('./config/db')()

const imageQueue = require('./queues/imageQueue')

async function checkQueue() {
  await new Promise(r => setTimeout(r, 1500))

  const [waiting, active, completed, failed, delayed] = await Promise.all([
    imageQueue.getWaiting(),
    imageQueue.getActive(),
    imageQueue.getCompleted(),
    imageQueue.getFailed(),
    imageQueue.getDelayed(),
  ])

  console.log(`Queue status:`)
  console.log(`  Waiting:   ${waiting.length}`)
  console.log(`  Active:    ${active.length}`)
  console.log(`  Completed: ${completed.length}`)
  console.log(`  Failed:    ${failed.length}`)
  console.log(`  Delayed:   ${delayed.length}`)

  if (failed.length > 0) {
    console.log('\nFailed jobs:')
    failed.forEach(j => console.log(`  Job ${j.id} — book ${j.data.bookId} page ${j.data.pageNumber}: ${j.failedReason?.slice(0, 100)}`))
  }

  if (waiting.length > 0) {
    console.log('\nWaiting jobs:')
    waiting.forEach(j => console.log(`  Job ${j.id} — book ${j.data.bookId} page ${j.data.pageNumber}`))
  }

  setTimeout(() => process.exit(0), 500)
}

checkQueue().catch(err => { console.error(err); process.exit(1) })
