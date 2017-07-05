const Router = require('koa-router')
const problems = require('../controllers/problems')
const { loginRequired, adminRequired } = require('../middlewares')

const router = new Router({
  prefix: '/problems'
})

router
  .param('pid', problems.validatePid)
  .get('/:pid', problems.queryOneProblem)
  .put('/:pid', loginRequired, adminRequired, problems.update)
  .del('/:pid', loginRequired, adminRequired, problems.del)

router
  .get('/', problems.queryList)
  .post('/', loginRequired, adminRequired, problems.create)

module.exports = router
