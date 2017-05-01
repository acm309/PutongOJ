const Router = require('koa-router')
const problems = require('../controllers/problems')
const { loginRequired } = require('../middlewares')

const router = new Router({
  prefix: '/problems'
})

router.get('/', problems.queryList)
router.get('/:pid', problems.queryOneProblem)
router.put('/:pid', loginRequired, problems.update)

module.exports = router
