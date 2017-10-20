const Router = require('koa-router')
const problems = require('../controllers/problems')
const { loginRequired, adminRequired } = require('../middlewares')

const router = new Router()

router
  .post('/api/problems/:pid/testdata', loginRequired, adminRequired, problems.testData)
  .get('/problems/:pid/testdata', loginRequired, adminRequired, problems.sendTestData)

module.exports = router
