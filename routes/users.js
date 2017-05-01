const Router = require('koa-router')
const users = require('../controllers/users')
const { loginRequired } = require('../middlewares')

const router = new Router({
  prefix: '/users'
})

router.get('/:uid', users.queryOneUser)
router.post('/', users.register)
router.put('/:uid', loginRequired, users.update)

module.exports = router
