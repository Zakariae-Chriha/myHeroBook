const router = require('express').Router()
const adminController = require('../controllers/admin.controller')
const { authenticate, requireAdmin } = require('../middleware/auth.middleware')

router.use(authenticate, requireAdmin)

router.get('/stats',  adminController.getStats)
router.get('/users',  adminController.getUsers)
router.get('/books',  adminController.getBooks)
router.get('/orders', adminController.getOrders)
router.post('/books/:id/retry', adminController.retryBook)

router.patch('/users/:id/toggle-admin', adminController.toggleAdmin)

router.get('/promo-codes', adminController.getPromoCodes)
router.post('/promo-codes', adminController.createPromoCode)
router.patch('/promo-codes/:id', adminController.updatePromoCode)
router.delete('/promo-codes/:id', adminController.deletePromoCode)

module.exports = router
