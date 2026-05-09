import api from './api.js'

export const bookService = {
  createBook: (data) => api.post('/books/create', data),
  getMyBooks: (page = 1) => api.get(`/books/my-books?page=${page}`),
  getBook: (id) => api.get(`/books/${id}`),
  generateStory: (id) => api.post(`/books/${id}/generate-story`),
  generateImages: (id) => api.post(`/books/${id}/generate-images`),
  generateVoice: (id) => api.post(`/books/${id}/generate-voice`),
  assemblePdf: (id) => api.post(`/books/${id}/assemble-pdf`),
  getProgress: (id) => api.get(`/books/${id}/progress`),
  getPreviewPages: (id) => api.get(`/books/${id}/preview-pages`),
  downloadPdf: (id) => api.get(`/books/${id}/download-pdf`),
  setCover: (id, pageIndex) => api.patch(`/books/${id}/cover`, { pageIndex }),
}

export const childService = {
  createChild: (data) => api.post('/children/create', data),
  getMyChildren: () => api.get('/children/my-children'),
  getChild: (id) => api.get(`/children/${id}`),
  updateChild: (id, data) => api.put(`/children/${id}/update`, data),
  deleteChild: (id) => api.delete(`/children/${id}`),
  uploadPhoto: (id, formData) =>
    api.post(`/children/${id}/upload-photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
}
