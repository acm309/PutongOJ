const Router = require('koa-router')
const users = require('../controllers/users')
const { loginRequired, adminRequired } = require('../middlewares')

const router = new Router({
  prefix: '/users'
})

router.get('/:uid', users.queryOneUser)
router.post('/', users.register)
router.put('/:uid', loginRequired, users.update)
router.get('/', loginRequired, adminRequired, users.queryUsers)

module.exports = router
