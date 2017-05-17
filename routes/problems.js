const Router = require('koa-router')
const problems = require('../controllers/problems')
const { loginRequired, adminRequired, idNumberRequired } = require('../middlewares')

const router = new Router({
  prefix: '/problems'
})

router.get('/', problems.queryList)
router.get('/:pid', idNumberRequired('pid'), problems.queryOneProblem)
router.put('/:pid', idNumberRequired('pid'), loginRequired, adminRequired, problems.update)
router.del('/:pid', idNumberRequired('pid'), loginRequired, adminRequired, problems.del)
router.post('/', loginRequired, adminRequired, problems.create)
router.post('/:pid/testdata', idNumberRequired('pid'), loginRequired, adminRequired, problems.testData)
router.get('/:pid/testdata', idNumberRequired('pid'), loginRequired, adminRequired, problems.sendTestData)

module.exports = router
