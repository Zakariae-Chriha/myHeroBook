export const formatPrice = (price, currency = 'EUR') =>
  new Intl.NumberFormat('en-EU', { style: 'currency', currency }).format(price)

export const formatDate = (date) =>
  new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(date))

export const slugify = (text) =>
  text.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-')

export const generateBookTitle = (childName, jobLabel) =>
  `${childName} and the ${jobLabel} Adventure!`

export const getProgressPercentage = (progress) => {
  if (!progress) return 0
  const { storyDone, imagesCompleted, voiceCompleted, pdfDone } = progress
  let total = 0
  if (storyDone) total += 10
  total += (imagesCompleted / 32) * 60
  if (voiceCompleted > 0) total += (voiceCompleted / 32) * 20
  if (pdfDone) total += 10
  return Math.min(Math.round(total), 100)
}

export const getProgressLabel = (status) => {
  const labels = {
    draft: 'Getting ready...',
    generating_story: 'Writing your unique story...',
    generating_images: 'Illustrating your child as the hero...',
    generating_voice: 'Recording page narrations...',
    assembling_pdf: 'Assembling your book...',
    ready: 'Your book is ready! 🎉',
    failed: 'Something went wrong. Please try again.',
  }
  return labels[status] || 'Processing...'
}

export const validateImageFile = (file) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  const maxSizeMB = 10
  if (!allowedTypes.includes(file.type)) {
    return 'Please upload a JPG, PNG, or WEBP image.'
  }
  if (file.size > maxSizeMB * 1024 * 1024) {
    return `Image must be smaller than ${maxSizeMB}MB.`
  }
  return null
}

export const classNames = (...classes) => classes.filter(Boolean).join(' ')

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export const truncate = (str, maxLength = 100) =>
  str.length > maxLength ? `${str.substring(0, maxLength)}...` : str
