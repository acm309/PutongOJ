const Router = require('koa-router')
const status = require('../controllers/status')
const { loginRequired, adminRequired } = require('../middlewares')

const router = new Router({
  prefix: '/status'
})

router
  .param('sid', status.validateSid)
  .get('/:sid', loginRequired, status.queryOneSolution)
  .put('/:sid', loginRequired, adminRequired, status.rejudge)

router
  .get('/', status.queryList)
  .post('/', loginRequired, status.create)

module.exports = router
