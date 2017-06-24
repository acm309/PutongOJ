const Router = require('koa-router')
const users = require('../controllers/users')
const { loginRequired, adminRequired } = require('../middlewares')

const router = new Router({
  prefix: '/users'
})

router
  .param('uid', users.validateUid)
  .get('/:uid', users.queryOneUser)
  .put('/:uid', loginRequired, users.update)

router
  .post('/', users.register)
  .get('/', loginRequired, adminRequired, users.queryUsers)

module.exports = router
