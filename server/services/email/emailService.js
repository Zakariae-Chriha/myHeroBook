const nodemailer = require('nodemailer')
const logger = require('../../utils/logger')

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

const FROM_NAME = process.env.EMAIL_FROM_NAME || 'The Hero Kids StoryLab'
const FROM_EMAIL = process.env.GMAIL_USER

async function send(to, subject, html, text) {
  try {
    await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to,
      subject,
      html,
      text,
    })
    logger.info(`Email sent to ${to}: ${subject}`)
  } catch (err) {
    logger.error(`Failed to send email to ${to}: ${err.message}`)
    throw err
  }
}

exports.sendPasswordReset = async (user, resetUrl) => {
  const subject = 'Reset your Hero Kids StoryLab password'
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"></head>
    <body style="font-family:Inter,sans-serif;background:#0A0E1A;color:#F5EDD6;margin:0;padding:0;">
      <div style="max-width:560px;margin:40px auto;background:#1E2A4A;border-radius:16px;overflow:hidden;border:1px solid rgba(201,168,76,0.2);">
        <div style="background:linear-gradient(135deg,#C9A84C,#E8C76B);padding:32px;text-align:center;">
          <h1 style="margin:0;color:#0A0E1A;font-size:24px;font-family:Georgia,serif;">
            📖 Hero Kids StoryLab
          </h1>
        </div>
        <div style="padding:40px 32px;">
          <h2 style="color:#fff;margin-top:0;">Hi ${user.firstName},</h2>
          <p style="color:#F5EDD6;line-height:1.6;">
            We received a request to reset your password. Click the button below to choose a new one.
          </p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${resetUrl}"
               style="background:linear-gradient(135deg,#C9A84C,#E8C76B);color:#0A0E1A;font-weight:700;
                      padding:14px 32px;border-radius:12px;text-decoration:none;font-size:16px;
                      display:inline-block;">
              Reset My Password
            </a>
          </div>
          <p style="color:#6B7A99;font-size:13px;line-height:1.6;">
            This link expires in <strong>1 hour</strong>. If you didn't request this, you can safely ignore this email.
          </p>
          <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:24px 0;">
          <p style="color:#6B7A99;font-size:12px;text-align:center;margin:0;">
            © ${new Date().getFullYear()} Hero Kids StoryLab · Made with 💛 for children everywhere
          </p>
        </div>
      </div>
    </body>
    </html>
  `
  const text = `Hi ${user.firstName},\n\nReset your password here: ${resetUrl}\n\nThis link expires in 1 hour.`
  await send(user.email, subject, html, text)
}

exports.sendOrderConfirmation = async (user, order) => {
  const tierLabels = { digital: 'Digital PDF Book', printed: 'Printed Hardcover Book', voice: 'Magic Voice Book' }
  const subject = `Order confirmed — ${tierLabels[order.tier] || 'Your book'} is being created! 🎉`
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"></head>
    <body style="font-family:Inter,sans-serif;background:#0A0E1A;color:#F5EDD6;margin:0;padding:0;">
      <div style="max-width:560px;margin:40px auto;background:#1E2A4A;border-radius:16px;overflow:hidden;border:1px solid rgba(201,168,76,0.2);">
        <div style="background:linear-gradient(135deg,#C9A84C,#E8C76B);padding:32px;text-align:center;">
          <h1 style="margin:0;color:#0A0E1A;font-size:24px;font-family:Georgia,serif;">
            📖 Hero Kids StoryLab
          </h1>
        </div>
        <div style="padding:40px 32px;">
          <h2 style="color:#fff;margin-top:0;">Order Confirmed! 🌟</h2>
          <p style="color:#F5EDD6;line-height:1.6;">
            Hi ${user.firstName}, your payment was successful. We're now creating the magic —
            your <strong style="color:#E8C76B;">${tierLabels[order.tier]}</strong> is being generated.
          </p>
          <div style="background:rgba(0,0,0,0.2);border-radius:12px;padding:20px;margin:24px 0;">
            <p style="margin:0 0 8px;color:#6B7A99;font-size:13px;">ORDER ID</p>
            <p style="margin:0;color:#fff;font-family:monospace;font-size:14px;">${order._id}</p>
          </div>
          <p style="color:#F5EDD6;line-height:1.6;">
            We'll email you when your book is ready to download. You can also track progress in your
            <a href="${process.env.CLIENT_URL}/dashboard" style="color:#E8C76B;">dashboard</a>.
          </p>
          <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:24px 0;">
          <p style="color:#6B7A99;font-size:12px;text-align:center;margin:0;">
            © ${new Date().getFullYear()} Hero Kids StoryLab · Made with 💛 for children everywhere
          </p>
        </div>
      </div>
    </body>
    </html>
  `
  const text = `Hi ${user.firstName}, your order (${order._id}) has been confirmed! Check your dashboard: ${process.env.CLIENT_URL}/dashboard`
  await send(user.email, subject, html, text)
}

exports.sendDownloadReady = async (user, order, downloadUrl) => {
  const subject = '📖 Your Hero Kids book is ready to download!'
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"></head>
    <body style="font-family:Inter,sans-serif;background:#0A0E1A;color:#F5EDD6;margin:0;padding:0;">
      <div style="max-width:560px;margin:40px auto;background:#1E2A4A;border-radius:16px;overflow:hidden;border:1px solid rgba(201,168,76,0.2);">
        <div style="background:linear-gradient(135deg,#C9A84C,#E8C76B);padding:32px;text-align:center;">
          <h1 style="margin:0;color:#0A0E1A;font-size:24px;font-family:Georgia,serif;">
            📖 Hero Kids StoryLab
          </h1>
        </div>
        <div style="padding:40px 32px;">
          <h2 style="color:#fff;margin-top:0;">Your book is ready! 🎉</h2>
          <p style="color:#F5EDD6;line-height:1.6;">
            Hi ${user.firstName}, the adventure is complete! Your personalised children's book
            is ready to download. This link is valid for <strong>7 days</strong>.
          </p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${downloadUrl}"
               style="background:linear-gradient(135deg,#C9A84C,#E8C76B);color:#0A0E1A;font-weight:700;
                      padding:14px 32px;border-radius:12px;text-decoration:none;font-size:16px;
                      display:inline-block;">
              Download Your Book
            </a>
          </div>
          <p style="color:#6B7A99;font-size:13px;">
            You can also access all your books any time from your
            <a href="${process.env.CLIENT_URL}/dashboard" style="color:#E8C76B;">dashboard</a>.
          </p>
          <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:24px 0;">
          <p style="color:#6B7A99;font-size:12px;text-align:center;margin:0;">
            © ${new Date().getFullYear()} Hero Kids StoryLab · Made with 💛 for children everywhere
          </p>
        </div>
      </div>
    </body>
    </html>
  `
  const text = `Hi ${user.firstName}, your book is ready! Download it here: ${downloadUrl} (valid 7 days)`
  await send(user.email, subject, html, text)
}

exports.sendBookReady = async (user, bookTitle, previewUrl) => {
  const subject = '🎉 Your Hero Kids book is ready to view!'
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"></head>
    <body style="font-family:Inter,sans-serif;background:#0A0E1A;color:#F5EDD6;margin:0;padding:0;">
      <div style="max-width:560px;margin:40px auto;background:#1E2A4A;border-radius:16px;overflow:hidden;border:1px solid rgba(201,168,76,0.2);">
        <div style="background:linear-gradient(135deg,#C9A84C,#E8C76B);padding:32px;text-align:center;">
          <h1 style="margin:0;color:#0A0E1A;font-size:24px;font-family:Georgia,serif;">
            📖 Hero Kids StoryLab
          </h1>
        </div>
        <div style="padding:40px 32px;">
          <h2 style="color:#fff;margin-top:0;">Your adventure is complete! 🎉</h2>
          <p style="color:#F5EDD6;line-height:1.6;">
            Hi ${user.firstName}, great news — <strong style="color:#E8C76B;">"${bookTitle}"</strong>
            is fully illustrated and ready for you to read!
          </p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${previewUrl}"
               style="background:linear-gradient(135deg,#C9A84C,#E8C76B);color:#0A0E1A;font-weight:700;
                      padding:14px 32px;border-radius:12px;text-decoration:none;font-size:16px;
                      display:inline-block;">
              View Your Book
            </a>
          </div>
          <p style="color:#6B7A99;font-size:13px;line-height:1.6;">
            Love what you see? Order a printed hardcover or a voice-narrated edition from the preview page.
          </p>
          <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:24px 0;">
          <p style="color:#6B7A99;font-size:12px;text-align:center;margin:0;">
            © ${new Date().getFullYear()} Hero Kids StoryLab · Made with 💛 for children everywhere
          </p>
        </div>
      </div>
    </body>
    </html>
  `
  const text = `Hi ${user.firstName}, your book "${bookTitle}" is ready! View it here: ${previewUrl}`
  await send(user.email, subject, html, text)
}

exports.sendTrackingUpdate = async (user, order) => {
  const subject = '📦 Your Hero Kids book has shipped!'
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"></head>
    <body style="font-family:Inter,sans-serif;background:#0A0E1A;color:#F5EDD6;margin:0;padding:0;">
      <div style="max-width:560px;margin:40px auto;background:#1E2A4A;border-radius:16px;overflow:hidden;border:1px solid rgba(201,168,76,0.2);">
        <div style="background:linear-gradient(135deg,#C9A84C,#E8C76B);padding:32px;text-align:center;">
          <h1 style="margin:0;color:#0A0E1A;font-size:24px;font-family:Georgia,serif;">
            📖 Hero Kids StoryLab
          </h1>
        </div>
        <div style="padding:40px 32px;">
          <h2 style="color:#fff;margin-top:0;">Your book is on its way! 📦</h2>
          <p style="color:#F5EDD6;line-height:1.6;">
            Hi ${user.firstName}, your printed Hero Kids book has been dispatched and is heading your way!
          </p>
          ${order.gelato?.trackingNumber ? `
          <div style="background:rgba(0,0,0,0.2);border-radius:12px;padding:20px;margin:24px 0;">
            <p style="margin:0 0 4px;color:#6B7A99;font-size:13px;">TRACKING NUMBER</p>
            <p style="margin:0 0 12px;color:#fff;font-family:monospace;">${order.gelato.trackingNumber}</p>
            ${order.gelato.trackingUrl ? `<a href="${order.gelato.trackingUrl}" style="color:#E8C76B;font-size:14px;">Track your parcel →</a>` : ''}
          </div>
          ` : ''}
          <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:24px 0;">
          <p style="color:#6B7A99;font-size:12px;text-align:center;margin:0;">
            © ${new Date().getFullYear()} Hero Kids StoryLab · Made with 💛 for children everywhere
          </p>
        </div>
      </div>
    </body>
    </html>
  `
  const text = `Hi ${user.firstName}, your book has shipped! Tracking: ${order.gelato?.trackingNumber || 'N/A'}`
  await send(user.email, subject, html, text)
}
