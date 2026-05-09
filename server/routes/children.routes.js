const router = require('express').Router()
const childrenController = require('../controllers/children.controller')
const { authenticate } = require('../middleware/auth.middleware')
const { validateBody, createChildSchema } = require('../middleware/validate.middleware')
const { uploadSingle } = require('../middleware/upload.middleware')

router.use(authenticate)

router.post('/create', validateBody(createChildSchema), childrenController.createChild)
router.get('/my-children', childrenController.getMyChildren)
router.get('/:id', childrenController.getChild)
router.put('/:id/update', childrenController.updateChild)
router.delete('/:id', childrenController.deleteChild)
router.post('/:id/upload-photo', uploadSingle('photo'), childrenController.uploadPhoto)

module.exports = router
