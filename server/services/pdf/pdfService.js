const puppeteer = require('puppeteer')
const sharp = require('sharp')
const logger = require('../../utils/logger')

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function escapeHtml(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// Download an image, compress it with Sharp, return a base64 data URI.
// Embedding compressed inline images keeps the PDF under 5 MB regardless of source.
async function fetchAndCompress(url) {
  if (!url) return null
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(30000) })
    if (!res.ok) return null
    const raw = Buffer.from(await res.arrayBuffer())
    const compressed = await sharp(raw)
      .resize({ width: 700, height: 700, fit: 'cover' })
      .jpeg({ quality: 58 })
      .toBuffer()
    return `data:image/jpeg;base64,${compressed.toString('base64')}`
  } catch (err) {
    logger.warn(`[pdfService] Image compress failed (${url?.slice(0, 60)}): ${err.message}`)
    return url // fallback to original URL — better than blank
  }
}

// ─── COVER PAGE ───────────────────────────────────────────────────────────────

function buildCoverPage(book, child, compressedImages) {
  const firstPage = book.story.pages.find((p) => p.imageUrl)
  const coverImageUrl = firstPage ? (compressedImages[firstPage.pageNumber] || firstPage.imageUrl) : ''
  const episodeBadge = book.episodeNumber > 1
    ? `Episode ${book.episodeNumber} · `
    : ''

  return `
  <div class="book-page cover-page">
    <div class="cover-border"></div>

    <div class="cover-badge">✦ ${episodeBadge}Hero Universe ✦</div>

    ${coverImageUrl ? `
    <div class="cover-image-frame">
      <img src="${escapeHtml(coverImageUrl)}" class="cover-image" alt="Cover" />
    </div>` : `
    <div class="cover-image-frame cover-image-placeholder">
      <span style="font-size:72pt">📖</span>
    </div>`}

    <h1 class="cover-title">${escapeHtml(book.title || `${child.name}'s Great Adventure`)}</h1>

    ${book.isGift && book.giftRecipient ? `
    <p class="cover-child-name">
      A gift for <span class="cover-name-highlight">${escapeHtml(book.giftRecipient)}</span>
    </p>
    <p class="cover-gift-from">featuring <span style="color:rgba(245,237,214,0.75)">${escapeHtml(child.name)}</span> as the hero</p>` : `
    <p class="cover-child-name">
      A story for <span class="cover-name-highlight">${escapeHtml(child.name)}</span>
    </p>`}

    ${book.dedication ? `
    <p class="cover-dedication">"${escapeHtml(book.dedication)}"</p>` : ''}

    <div class="cover-footer">
      <span>The Hero Kids StoryLab</span>
      <span class="cover-footer-dot">·</span>
      <span>herokidsstorylab.com</span>
    </div>
  </div>`
}

// ─── STORY PAGES ──────────────────────────────────────────────────────────────

function buildStoryPage(page, compressedImages) {
  const hasQr = Boolean(page.qrCodeUrl)
  const imgSrc = compressedImages[page.pageNumber] || page.imageUrl

  return `
  <div class="book-page story-page">
    <div class="page-illustration">
      ${imgSrc
        ? `<img src="${escapeHtml(imgSrc)}" class="page-image" alt="Page ${page.pageNumber}" />`
        : `<div class="page-image-placeholder"><span>✨</span></div>`
      }
    </div>

    <div class="page-divider"></div>

    <div class="page-text-area">
      <p class="page-text">${escapeHtml(page.text)}</p>

      <div class="page-footer">
        <span class="page-number">— ${page.pageNumber} —</span>
        ${hasQr ? `
        <div class="page-qr">
          <span class="page-qr-label">🎧 Hear this page</span>
          <img src="${escapeHtml(page.qrCodeUrl)}" class="page-qr-image" alt="QR code" />
        </div>` : ''}
      </div>
    </div>
  </div>`
}

// ─── FULL HTML DOCUMENT ───────────────────────────────────────────────────────

function buildFullHtml(book, child, compressedImages) {
  const coverHtml = buildCoverPage(book, child, compressedImages)
  const pagesHtml = book.story.pages.map((p) => buildStoryPage(p, compressedImages)).join('\n')

  return `<!DOCTYPE html>
<html lang="${escapeHtml(book.language || 'en')}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link
    rel="preconnect"
    href="https://fonts.googleapis.com"
    crossorigin
  />
  <link
    href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Nunito:wght@400;600;700&display=swap"
    rel="stylesheet"
  />
  <style>
    /* ── Reset ── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    /* ── Page setup ── */
    @page { size: 8.5in 8.5in; margin: 0; }
    body {
      background: white;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .book-page {
      width: 8.5in;
      height: 8.5in;
      overflow: hidden;
      page-break-after: always;
      break-after: page;
      position: relative;
    }
    .book-page:last-of-type {
      page-break-after: avoid;
      break-after: avoid;
    }

    /* ── Cover ── */
    .cover-page {
      background: linear-gradient(160deg, #0D1220 0%, #141929 55%, #0A0E1A 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 0.45in;
      font-family: 'Playfair Display', Georgia, 'Times New Roman', serif;
    }
    .cover-border {
      position: absolute;
      inset: 0.22in;
      border: 2.5px solid rgba(201, 168, 76, 0.38);
      border-radius: 14px;
      pointer-events: none;
    }
    .cover-badge {
      font-family: 'Nunito', Arial, sans-serif;
      font-size: 10.5pt;
      font-weight: 700;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: rgba(201, 168, 76, 0.85);
      margin-bottom: 0.22in;
    }
    .cover-image-frame {
      width: 3.4in;
      height: 3.4in;
      border-radius: 14px;
      overflow: hidden;
      border: 4px solid rgba(201, 168, 76, 0.55);
      box-shadow: 0 0 48px rgba(201, 168, 76, 0.28), 0 8px 32px rgba(0,0,0,0.5);
      margin-bottom: 0.28in;
      flex-shrink: 0;
    }
    .cover-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .cover-image-placeholder {
      background: linear-gradient(135deg, #1a2035, #252e4a);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .cover-title {
      font-size: 26pt;
      font-weight: 900;
      color: #C9A84C;
      text-align: center;
      line-height: 1.22;
      margin-bottom: 0.14in;
      max-width: 6.5in;
    }
    .cover-child-name {
      font-family: 'Nunito', Arial, sans-serif;
      font-size: 13pt;
      color: rgba(245, 237, 214, 0.85);
      letter-spacing: 0.05em;
    }
    .cover-name-highlight {
      color: #C9A84C;
      font-weight: 700;
    }
    .cover-gift-from {
      font-family: 'Nunito', Arial, sans-serif;
      font-size: 10pt;
      color: rgba(245, 237, 214, 0.5);
      margin-top: 4px;
      letter-spacing: 0.03em;
    }
    .cover-dedication {
      font-family: 'Nunito', Arial, sans-serif;
      font-style: italic;
      font-size: 9.5pt;
      color: rgba(245, 237, 214, 0.55);
      margin-top: 0.28in;
      text-align: center;
      max-width: 5.2in;
      line-height: 1.65;
    }
    .cover-footer {
      position: absolute;
      bottom: 0.4in;
      font-family: 'Nunito', Arial, sans-serif;
      font-size: 8pt;
      letter-spacing: 0.08em;
      color: rgba(201, 168, 76, 0.4);
      text-transform: uppercase;
    }
    .cover-footer-dot {
      margin: 0 6px;
    }

    /* ── Story pages ── */
    .story-page {
      background: #FEFCF5;
      display: flex;
      flex-direction: column;
    }
    .page-illustration {
      flex: 0 0 58%;
      overflow: hidden;
      position: relative;
    }
    .page-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .page-image-placeholder {
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #e8e0d0, #d4cbbf);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 56pt;
    }
    .page-divider {
      height: 3px;
      flex-shrink: 0;
      background: linear-gradient(90deg, transparent 0%, rgba(201,168,76,0.45) 30%, rgba(201,168,76,0.45) 70%, transparent 100%);
    }
    .page-text-area {
      flex: 1;
      padding: 0.26in 0.42in 0.2in;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .page-text {
      font-family: 'Nunito', Arial, sans-serif;
      font-size: 13.5pt;
      font-weight: 500;
      line-height: 1.68;
      color: #1E2030;
    }
    .page-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 0.1in;
    }
    .page-number {
      font-family: 'Nunito', Arial, sans-serif;
      font-size: 9pt;
      color: rgba(107, 122, 153, 0.65);
      letter-spacing: 0.05em;
    }
    .page-qr {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .page-qr-label {
      font-family: 'Nunito', Arial, sans-serif;
      font-size: 8pt;
      color: rgba(107, 122, 153, 0.6);
    }
    .page-qr-image {
      width: 0.52in;
      height: 0.52in;
    }
  </style>
</head>
<body>
  ${coverHtml}
  ${pagesHtml}
</body>
</html>`
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────

exports.assembleBook = async function assembleBook(book, child) {
  logger.info(`[pdfService] Assembling PDF for book ${book._id} — "${book.title}", ${book.story.pages.length} pages`)
  const startTime = Date.now()

  // ── Pre-compress all images into base64 data URIs ─────────────────────────
  // This embeds ~40 KB compressed JPEGs instead of linking 500 KB+ PNGs,
  // keeping the final PDF under 5 MB regardless of image host.
  logger.info('[pdfService] Compressing images for PDF embedding…')
  const compressedImages = {}
  await Promise.all(
    book.story.pages
      .filter((p) => p.imageUrl)
      .map(async (p) => {
        const uri = await fetchAndCompress(p.imageUrl)
        if (uri) compressedImages[p.pageNumber] = uri
      })
  )
  logger.info(`[pdfService] Compressed ${Object.keys(compressedImages).length} images`)

  const html = buildFullHtml(book, child, compressedImages)

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--font-render-hinting=none',
    ],
  })

  let pdfBuffer
  try {
    const page = await browser.newPage()

    // Images are inline base64 — only Google Fonts needs to load externally
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 60000 })

    // Brief pause for fonts and final layout
    await new Promise((r) => setTimeout(r, 1000))

    pdfBuffer = await page.pdf({
      width: '8.5in',
      height: '8.5in',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    })
  } finally {
    await browser.close()
  }

  const elapsed = Date.now() - startTime
  const sizeKb = Math.round(pdfBuffer.length / 1024)
  logger.info(`[pdfService] PDF assembled in ${elapsed}ms — ${sizeKb} KB`)

  return pdfBuffer
}
