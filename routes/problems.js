const Router = require('koa-router')
const problems = require('../controllers/problems')
const { loginRequired, adminRequired } = require('../middlewares')

const router = new Router({
  prefix: '/problems'
})

router.get('/', problems.queryList)
router.get('/:pid', problems.queryOneProblem)
router.put('/:pid', loginRequired, adminRequired, problems.update)
router.del('/:pid', loginRequired, adminRequired, problems.del)
router.post('/', loginRequired, adminRequired, problems.create)

module.exports = router
