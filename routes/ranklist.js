const Router = require('koa-router')
const ranklist = require('../controllers/ranklist')

const router = new Router({
  prefix: '/ranklist'
})

router.get('/list', ranklist.find)

module.exports = router
