const Router = require('koa-router')
const contests = require('../controllers/contests')
const { loginRequired, adminRequired } = require('../middlewares')

const router = new Router({
  prefix: '/contests'
})

router.get('/', contests.queryList)
router.get('/:cid', contests.queryOneContest)
router.get('/:cid/overview', contests.overview)
router.get('/:cid/ranklist', contests.ranklist)
router.post('/', loginRequired, adminRequired, contests.create)
router.put('/:cid', loginRequired, adminRequired, contests.update)
router.del('/:cid', loginRequired, adminRequired, contests.del)

module.exports = router
