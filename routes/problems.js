const Router = require('koa-router')
const problems = require('../controllers/problems')

const router = new Router({
  prefix: '/problems'
})

router.get('/', problems.queryList)

module.exports = router
