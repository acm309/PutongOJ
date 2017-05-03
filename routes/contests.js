const Router = require('koa-router')
const contests = require('../controllers/contests')
const { loginRequired, adminRequired, idNumberRequired } = require('../middlewares')

const router = new Router({
  prefix: '/contests'
})

router.get('/', contests.queryList)
router.get('/:cid', idNumberRequired('cid'), contests.queryOneContest)
router.get('/:cid/overview', idNumberRequired('cid'), contests.overview)
router.get('/:cid/ranklist', idNumberRequired('cid'), contests.ranklist)
router.post('/', loginRequired, adminRequired, contests.create)
router.put('/:cid', idNumberRequired('cid'), loginRequired, adminRequired, contests.update)
router.del('/:cid', idNumberRequired('cid'), loginRequired, adminRequired, contests.del)

module.exports = router
