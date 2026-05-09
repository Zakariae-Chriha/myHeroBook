const router = require('express').Router()
const ordersController = require('../controllers/orders.controller')
const { authenticate } = require('../middleware/auth.middleware')
const { validateBody, createCheckoutSchema } = require('../middleware/validate.middleware')

router.use(authenticate)

router.post('/validate-promo', ordersController.validatePromo)
router.post('/create-checkout-session', validateBody(createCheckoutSchema), ordersController.createCheckoutSession)
router.post('/:id/verify-payment', ordersController.verifyPayment)
router.get('/my-orders', ordersController.getMyOrders)
router.get('/:id', ordersController.getOrder)
router.get('/:id/download', ordersController.getDownloadUrl)

module.exports = router
