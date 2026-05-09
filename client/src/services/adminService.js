import api from './api.js'

export const adminService = {
  getStats:         ()           => api.get('/admin/stats'),
  toggleAdmin:      (id)         => api.patch(`/admin/users/${id}/toggle-admin`),
  getUsers:         (page = 1, search = '') => api.get(`/admin/users?page=${page}&search=${encodeURIComponent(search)}`),
  getBooks:         (page = 1, status = '') => api.get(`/admin/books?page=${page}&status=${status}`),
  getOrders:        (page = 1, status = '') => api.get(`/admin/orders?page=${page}&status=${status}`),
  retryBook:        (id)         => api.post(`/admin/books/${id}/retry`),
  getPromoCodes:    ()           => api.get('/admin/promo-codes'),
  createPromoCode:  (data)       => api.post('/admin/promo-codes', data),
  updatePromoCode:  (id, data)   => api.patch(`/admin/promo-codes/${id}`, data),
  deletePromoCode:  (id)         => api.delete(`/admin/promo-codes/${id}`),
}
