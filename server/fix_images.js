require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') })
require('./config/db')()

const BookProject = require('./models/BookProject')
require('./models/ChildProfile') // register schema for populate
const imageQueue = require('./queues/imageQueue')

async function fixStuckBooks() {
  await new Promise(r => setTimeout(r, 2000))

  const stuckBooks = await BookProject.find({ status: 'generating_images' })
    .populate('childId', 'photoUrl')

  console.log(`Found ${stuckBooks.length} stuck book(s)`)

  for (const book of stuckBooks) {
    if (!book.story?.pages?.length) {
      console.log(`Book ${book._id} has no pages — skipping`)
      continue
    }

    console.log(`\nFixing: "${book.title}"`)
    console.log(`  ${book.story.pages.length} pages, imagesCompleted: ${book.generationProgress.imagesCompleted}`)

    await BookProject.updateOne(
      { _id: book._id },
      {
        $set: {
          'generationProgress.imagesCompleted': 0,
          'generationProgress.pdfDone': false,
          status: 'generating_images',
        },
        $unset: { 'story.pages.$[].imageUrl': 1 },
      }
    )

    // Remove old stale single-page jobs (ones with no pageNumber)
    const waiting = await imageQueue.getWaiting()
    const active = await imageQueue.getActive()
    for (const job of [...waiting, ...active]) {
      if (job.data.bookId === book._id.toString() && !job.data.pageNumber) {
        await job.remove().catch(() => {})
        console.log(`  Removed stale job ${job.id}`)
      }
    }

    const imageJobs = book.story.pages.map((page) => ({
      name: '__default__',
      data: {
        bookId: book._id.toString(),
        pageNumber: page.pageNumber,
        imagePrompt: page.imagePrompt,
        artStyle: book.artStyle,
        childPhotoUrl: book.childId?.photoUrl || null,
      },
      opts: {
        attempts: 2,
        backoff: { type: 'fixed', delay: 30000 },
        removeOnComplete: true,
      },
    }))

    await imageQueue.addBulk(imageJobs)
    console.log(`  Dispatched ${imageJobs.length} page jobs`)
  }

  console.log('\nAll done — images will generate automatically now.')
  setTimeout(() => process.exit(0), 1000)
}

fixStuckBooks().catch(err => { console.error(err); process.exit(1) })
