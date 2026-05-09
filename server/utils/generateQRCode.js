// Full implementation in STEP 13
const QRCode = require('qrcode')

exports.generateQRCode = async (bookId, pageNumber, voiceType = 'standard') => {
  const url = `${process.env.CLIENT_URL}/read/${bookId}/${pageNumber}?voice=${voiceType}`
  return QRCode.toBuffer(url, {
    type: 'png',
    width: 200,
    margin: 1,
    color: { dark: '#0A0E1A', light: '#FFFFFF' },
  })
}
