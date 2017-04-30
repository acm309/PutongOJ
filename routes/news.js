const Router = require('koa-router')
const contests = require('../controllers/news')

const router = new Router({
  prefix: '/news'
})

router.get('/', contests.queryList)
// router.get('/:cid', contests.queryOneContest)

module.exports = router
