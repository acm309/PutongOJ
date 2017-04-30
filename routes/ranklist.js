const Router = require('koa-router')
const ranklist = require('../controllers/ranklist')

const router = new Router({
  prefix: '/ranklist'
})

router.get('/', ranklist.ranklist)

module.exports = router
