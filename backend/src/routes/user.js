const Router = require('@koa/router')
const user = require('../controllers/user')
const { auth, userCreateRateLimit } = require('../middlewares')

const router = new Router({
  prefix: '/user',
})

router.get('/list', user.find)
router.get('/:uid', user.preload, user.findOne)
router.post('/', userCreateRateLimit, user.create)
router.put('/:uid', auth.login, user.preload, user.update)

module.exports = router
