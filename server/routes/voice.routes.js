const router = require('express').Router()
const voiceController = require('../controllers/voice.controller')
const { authenticate } = require('../middleware/auth.middleware')
const { uploadSingle } = require('../middleware/upload.middleware')

router.use(authenticate)

router.post('/upload-sample', uploadSingle('voiceSample'), voiceController.uploadSample)
router.get('/status', voiceController.getStatus)

module.exports = router
