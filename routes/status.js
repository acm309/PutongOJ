const Router = require('koa-router')
const status = require('../controllers/status')
const { auth } = require('../utils/middlewares')

const router = new Router({
  prefix: '/status'
})

router.get('/list', status.find)
router.get('/:sid', auth.login, status.findOne)
router.post('/', auth.login, status.create)

module.exports = router
