const router = require('express').Router()
const seriesController = require('../controllers/series.controller')
const { authenticate } = require('../middleware/auth.middleware')

router.use(authenticate)

router.get('/my-series', seriesController.getMySeries)
router.get('/:id', seriesController.getSeries)
router.post('/create', seriesController.createSeries)

module.exports = router
