require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') })
require('./config/db')()
require('./models/ChildProfile')
const BookProject = require('./models/BookProject')

setTimeout(async () => {
  const books = await BookProject.find({ status: { $in: ['ready', 'generating_images', 'assembling_pdf'] } }).lean()
  for (const b of books) {
    const pages = b.story?.pages || []
    const good = pages.filter(p => p.imageUrl && p.imageUrl.includes('cloudinary.com'))
    const broken = pages.filter(p => !p.imageUrl || !p.imageUrl.includes('cloudinary.com'))
    console.log('\n=== ' + b.title + ' [' + b.status + ']')
    console.log('  Good (Cloudinary): ' + good.length + '/' + pages.length)
    if (broken.length > 0) {
      console.log('  Broken pages: ' + broken.map(p => 'p' + p.pageNumber).join(', '))
      broken.slice(0, 2).forEach(p => console.log('    p' + p.pageNumber + ': ' + (p.imageUrl || 'NO URL').slice(0, 80)))
    }
  }
  process.exit(0)
}, 2000)
