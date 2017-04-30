const Router = require('koa-router')
const users = require('../controllers/users')

const router = new Router({
  prefix: '/users'
})

router.get('/:uid', users.queryOneUser)

module.exports = router
