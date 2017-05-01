const Router = require('koa-router')
const contests = require('../controllers/contests')
const { loginRequired, adminRequired } = require('../middlewares')

const router = new Router({
  prefix: '/contests'
})

router.get('/', contests.queryList)
router.get('/:cid', contests.queryOneContest)
router.post('/', loginRequired, adminRequired, contests.create)
router.put('/:cid', loginRequired, adminRequired, contests.update)

module.exports = router
