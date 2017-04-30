const Router = require('koa-router')
const users = require('../controllers/users')

const router = new Router({
  prefix: '/users'
})

router.get('/:uid', users.queryOneUser)
router.post('/', users.register)
router.put('/:uid', users.register)

module.exports = router
