const Router = require('koa-router')
const contests = require('../controllers/contests')

const router = new Router({
  prefix: '/contests'
})

router.get('/', contests.queryList)
router.get('/:cid', contests.queryOneContest)

module.exports = router
