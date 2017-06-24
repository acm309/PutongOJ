const Router = require('koa-router')
const statistics = require('../controllers/statistics')
const problems = require('../controllers/problems')

const router = new Router({
  prefix: '/statistics'
})

router
  .param('pid', problems.validatePid)
  .get('/:pid', statistics.statistics)

module.exports = router
