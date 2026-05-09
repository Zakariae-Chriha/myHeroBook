const router = require('express').Router()
const authController = require('../controllers/auth.controller')
const { validateBody, registerSchema, loginSchema } = require('../middleware/validate.middleware')
const { authenticate } = require('../middleware/auth.middleware')

router.post('/register', validateBody(registerSchema), authController.register)
router.post('/login', validateBody(loginSchema), authController.login)
router.post('/logout', authController.logout)
router.post('/refresh-token', authController.refreshToken)
router.post('/forgot-password', authController.forgotPassword)
router.post('/reset-password', authController.resetPassword)
router.get('/me', authenticate, authController.getMe)
router.patch('/me', authenticate, authController.updateProfile)

module.exports = router
