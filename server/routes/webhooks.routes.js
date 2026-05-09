const router = require('express').Router()
const webhooksController = require('../controllers/webhooks.controller')

// Raw body already attached in app.js before json middleware
router.post('/stripe', webhooksController.handleStripe)
router.post('/gelato', webhooksController.handleGelato)

module.exports = router
