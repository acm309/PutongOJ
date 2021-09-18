const Router = require('koa-router')
const status = require('../controllers/status')
const { auth, solutionCreateRateLimit } = require('../utils/middlewares')

const router = new Router({
  prefix: '/status'
})

router.get('/list', status.find)
router.get('/:sid', auth.login, status.findOne)
router.post('/', auth.login, solutionCreateRateLimit, status.create)

module.exports = router
