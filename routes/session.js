const Router = require('koa-router')
const session = require('../controllers/session')

const router = new Router({
  prefix: '/session'
})

router.post('/', session.login)
router.del('/', session.logout)
router.get('/', session.fetchSession)

module.exports = router
