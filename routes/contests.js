const Router = require('koa-router')
const contests = require('../controllers/contests')
const { loginRequired, adminRequired } = require('../middlewares')

const router = new Router({
  prefix: '/contests'
})

router
  .get('/', contests.queryList)
  .post('/', loginRequired, adminRequired, contests.create)

// 先验证 cid 再运行其它中间件
router
  .param('cid', contests.validateCid)
  .get('/:cid', loginRequired, contests.queryOneContest)
  .get('/:cid/overview', contests.overview)
  .get('/:cid/ranklist', contests.ranklist)
  .put('/:cid', loginRequired, adminRequired, contests.update)
  .del('/:cid', loginRequired, adminRequired, contests.del)
  .post('/:cid/argument', loginRequired, contests.verifyArgument)

module.exports = router
