const Router = require('koa-router')
const problems = require('../controllers/problems')
const { loginRequired, adminRequired } = require('../middlewares')

const router = new Router({
  prefix: '/problems'
})

router
  .post('/:pid/testdata', loginRequired, adminRequired, problems.testData)
  .get('/:pid/testdata', loginRequired, adminRequired, problems.sendTestData)

module.exports = router
