import api from './api.js'

export const orderService = {
  createCheckoutSession: (data) => api.post('/orders/create-checkout-session', data),
  verifyPayment: (orderId, sessionId) => api.post(`/orders/${orderId}/verify-payment`, { sessionId }),
  getMyOrders: (page = 1) => api.get(`/orders/my-orders?page=${page}`),
  getOrder: (id) => api.get(`/orders/${id}`),
  getDownloadUrl: (id) => api.get(`/orders/${id}/download`),
  validatePromo: (code, tier) => api.post('/orders/validate-promo', { code, tier }),
}

export const voiceService = {
  uploadSample: (formData) =>
    api.post('/voice/upload-sample', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getStatus: () => api.get('/voice/status'),
}

export const seriesService = {
  getMySeries: () => api.get('/series/my-series'),
  getSeries: (id) => api.get(`/series/${id}`),
}
