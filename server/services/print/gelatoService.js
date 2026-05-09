const axios = require('axios')
const logger = require('../../utils/logger')

const gelatoApi = axios.create({
  baseURL: process.env.GELATO_API_URL || 'https://api.gelato.com',
  headers: {
    'X-API-KEY': process.env.GELATO_API_KEY,
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

// Product UID for a square hardcover photo book (~215×215mm).
// Must match the page count of the assembled PDF.
// Override via GELATO_PRODUCT_UID env var for the exact Gelato SKU on your account.
const PRODUCT_UID = process.env.GELATO_PRODUCT_UID || 'photobooks_hardcover_pf_215x215mm_36pgs'

// Shipment method: "standard" (5–7 days) or "express" (2–3 days)
const SHIPMENT_METHOD = process.env.GELATO_SHIPMENT_METHOD || 'standard'

function splitFullName(fullName) {
  const parts = (fullName || '').trim().split(/\s+/)
  const firstName = parts[0] || 'Customer'
  const lastName = parts.slice(1).join(' ') || firstName
  return { firstName, lastName }
}

function buildShippingAddress(addr, userEmail) {
  const { firstName, lastName } = splitFullName(addr.fullName)
  return {
    firstName,
    lastName,
    companyName: '',
    addressLine1: addr.line1,
    addressLine2: addr.line2 || '',
    city: addr.city,
    postCode: addr.postalCode,
    state: addr.state || '',
    country: addr.country.toUpperCase(),
    email: userEmail || '',
    phone: addr.phone || '',
  }
}

/**
 * Submit a print order to Gelato.
 *
 * @param {Object} order        - Order mongoose document (must have shippingAddress + tier)
 * @param {Object} book         - BookProject mongoose document (for reference IDs)
 * @param {string} pdfUrl       - Publicly accessible PDF URL (signed S3 URL or CDN)
 * @param {string} userEmail    - Buyer's email for Gelato shipping address
 * @returns {{ gelatoOrderId: string, gelatoStatus: string }}
 */
exports.createPrintOrder = async function createPrintOrder(order, book, pdfUrl, userEmail) {
  if (!order.shippingAddress) {
    throw new Error(`Order ${order._id} has no shipping address — cannot submit to Gelato`)
  }

  const shippingAddress = buildShippingAddress(order.shippingAddress, userEmail)

  const payload = {
    orderType: 'order',
    orderReferenceId: order._id.toString(),
    customerReferenceId: book._id.toString(),
    currency: (order.currency || 'eur').toUpperCase(),
    items: [
      {
        itemReferenceId: `item-${order._id}`,
        productUid: PRODUCT_UID,
        files: [
          {
            type: 'default',
            url: pdfUrl,
          },
        ],
        quantity: 1,
      },
    ],
    shipmentMethodUid: SHIPMENT_METHOD,
    shippingAddress,
  }

  logger.info(`[gelatoService] Submitting print order for order ${order._id}, book "${book.title}"`)

  let response
  try {
    response = await gelatoApi.post('/v4/orders', payload)
  } catch (err) {
    const status = err.response?.status
    const detail = err.response?.data?.message || err.message
    throw new Error(`Gelato API error (${status}): ${detail}`)
  }

  const gelatoOrder = response.data
  const gelatoOrderId = gelatoOrder.id || gelatoOrder.orderId

  if (!gelatoOrderId) {
    throw new Error(`Gelato returned no order ID. Response: ${JSON.stringify(gelatoOrder)}`)
  }

  logger.info(`[gelatoService] Print order created: ${gelatoOrderId} — status: ${gelatoOrder.status}`)

  return {
    gelatoOrderId,
    gelatoStatus: gelatoOrder.status || 'accepted',
  }
}

/**
 * Fetch the current status of a Gelato order.
 * Useful for manual polling or retries.
 */
exports.getOrderStatus = async function getOrderStatus(gelatoOrderId) {
  const response = await gelatoApi.get(`/v4/orders/${gelatoOrderId}`)
  return response.data
}
