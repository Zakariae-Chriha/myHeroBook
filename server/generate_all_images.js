/**
 * Direct sequential image generation — no queue complexity, no rate limit risk.
 * Generates all missing images one at a time with a 12-second gap between requests.
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') })
require('./config/db')()
require('./models/ChildProfile')

const BookProject = require('./models/BookProject')
const { generatePageImage } = require('./services/ai/imageService')
const logger = require('./utils/logger')

const DELAY_MS = 12000 // 12s between images — safe for Pollinations rate limit

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

async function run() {
  await sleep(2000) // wait for DB

  const books = await BookProject.find({ status: 'generating_images' })
    .populate('childId', 'photoUrl')

  console.log(`Found ${books.length} book(s) to process\n`)

  let totalGenerated = 0

  for (const book of books) {
    if (!book.story?.pages?.length) {
      console.log(`Skipping "${book.title}" — no pages`)
      continue
    }

    // Find pages that need images (no Cloudinary URL)
    const missingPages = book.story.pages.filter(
      p => !p.imageUrl || !p.imageUrl.includes('cloudinary.com')
    )

    console.log(`"${book.title}" — ${missingPages.length} pages need images`)

    for (let i = 0; i < missingPages.length; i++) {
      const page = missingPages[i]
      console.log(`  [${i + 1}/${missingPages.length}] Generating page ${page.pageNumber}...`)

      try {
        const imageUrl = await generatePageImage(
          page.imagePrompt,
          book.childId?.photoUrl || null,
          book.artStyle,
          book._id.toString(),
          page.pageNumber
        )

        if (imageUrl.includes('cloudinary.com')) {
          // Save to DB
          await BookProject.updateOne(
            { _id: book._id },
            {
              $set: { [`story.pages.$[p].imageUrl`]: imageUrl },
              $inc: { 'generationProgress.imagesCompleted': 1 },
            },
            { arrayFilters: [{ 'p.pageNumber': page.pageNumber }] }
          )
          totalGenerated++
          console.log(`  ✓ Page ${page.pageNumber} done (${imageUrl.slice(0, 60)}...)`)
        } else {
          console.log(`  ✗ Page ${page.pageNumber} — raw URL fallback (will retry next run)`)
        }
      } catch (err) {
        console.log(`  ✗ Page ${page.pageNumber} error: ${err.message}`)
      }

      // Delay between requests (skip delay after last page of last book)
      if (i < missingPages.length - 1 || book !== books[books.length - 1]) {
        process.stdout.write(`  Waiting ${DELAY_MS / 1000}s before next image...`)
        await sleep(DELAY_MS)
        process.stdout.write('\r' + ' '.repeat(50) + '\r')
      }
    }

    // Check if all images done → advance to PDF
    const refreshed = await BookProject.findById(book._id)
    const totalPages = refreshed.story?.pages?.length || 16
    const cloudinaryCount = (refreshed.story?.pages || []).filter(
      p => p.imageUrl?.includes('cloudinary.com')
    ).length

    console.log(`\n  ${cloudinaryCount}/${totalPages} Cloudinary images for "${book.title}"`)

    if (cloudinaryCount >= totalPages) {
      console.log(`  All done! Setting status to assembling_pdf...`)
      await BookProject.findByIdAndUpdate(book._id, { status: 'assembling_pdf' })

      // Add to PDF queue via the imageQueue mechanism
      const pdfQueue = require('./queues/pdfQueue')
      await pdfQueue.add(
        { bookId: book._id.toString(), userId: book.userId.toString() },
        { attempts: 2, backoff: { type: 'fixed', delay: 3000 } }
      )
      console.log(`  PDF assembly queued!`)
    }

    console.log()
  }

  console.log(`\nFinished. Generated ${totalGenerated} new images.`)
  setTimeout(() => process.exit(0), 2000)
}

run().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
