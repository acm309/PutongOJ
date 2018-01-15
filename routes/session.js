const Router = require('koa-router')
const session = require('../controllers/session')

const router = new Router({
  prefix: '/session'
})

router.post('/', session.login)
router.get('/', session.profile)
router.del('/', session.logout)

module.exports = router
