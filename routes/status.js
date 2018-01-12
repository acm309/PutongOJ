const status = require('../controllers/status')
const Router = require('koa-router')
const { auth } = require('../utils/middlewares')

const router = new Router({
  prefix: '/status'
})

router.get('/list', status.list)
router.get('/:sid', status.findOne)
router.post('/', auth.login, status.create)

module.exports = router
