const Router = require('koa-router')
const user = require('../controllers/user')
const { auth, userCreateRateLimit } = require('../utils/middlewares')

const router = new Router({
  prefix: '/user'
})

router.get('/list', user.find)
router.get('/:uid', user.preload, user.findOne)

// register
router.post('/', userCreateRateLimit, user.create)
router.put('/:uid', auth.login, user.preload, user.update)

// remove
router.del('/:uid', auth.login, user.preload, user.del)

module.exports = router
