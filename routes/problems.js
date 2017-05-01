const Router = require('koa-router')
const problems = require('../controllers/problems')

const router = new Router({
  prefix: '/problems'
})

router.get('/', problems.queryList)
router.get('/:pid', problems.queryOneProblem)
router.put('/:pid', problems.update)

module.exports = router
