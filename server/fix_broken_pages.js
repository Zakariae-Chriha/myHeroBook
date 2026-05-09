require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') })
require('./config/db')()

const BookProject = require('./models/BookProject')
require('./models/ChildProfile')
const imageQueue = require('./queues/imageQueue')

async function fixBrokenPages() {
  await new Promise(r => setTimeout(r, 2000))

  const books = await BookProject.find({
    status: { $in: ['generating_images', 'ready', 'assembling_pdf'] },
  }).populate('childId', 'photoUrl')

  console.log(`Checking ${books.length} book(s) for broken image URLs...`)

  for (const book of books) {
    if (!book.story?.pages?.length) continue

    const brokenPages = book.story.pages.filter(p =>
      !p.imageUrl || !p.imageUrl.includes('cloudinary.com')
    )

    console.log(`\n"${book.title}" — ${brokenPages.length} broken pages out of ${book.story.pages.length}`)

    if (brokenPages.length === 0) {
      console.log('  All images OK — skipping')
      continue
    }

    // Reset imagesCompleted to exclude broken pages so counter works correctly
    const goodPages = book.story.pages.length - brokenPages.length
    await BookProject.updateOne(
      { _id: book._id },
      {
        $set: {
          'generationProgress.imagesCompleted': goodPages,
          status: 'generating_images',
        },
      }
    )

    // Clear imageUrl only on broken pages
    for (const page of brokenPages) {
      await BookProject.updateOne(
        { _id: book._id },
        { $unset: { [`story.pages.${book.story.pages.indexOf(page)}.imageUrl`]: 1 } }
      )
    }

    const jobs = brokenPages.map((page) => ({
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
        backoff: { type: 'fixed', delay: 60000 },
        removeOnComplete: true,
      },
    }))

    await imageQueue.addBulk(jobs)
    console.log(`  Dispatched ${jobs.length} re-generation jobs for pages: ${brokenPages.map(p => p.pageNumber).join(', ')}`)
  }

  console.log('\nDone.')
  setTimeout(() => process.exit(0), 1000)
}

fixBrokenPages().catch(err => { console.error(err); process.exit(1) })
