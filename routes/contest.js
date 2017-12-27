const contest = require('../controllers/contest.js')
const Router = require('koa-router')

const router = new Router({
  prefix: '/contest'
})

router.get('/list', contest.list)
router.get('/:cid', contest.findOne)
router.get('/:cid/rank', contest.ranklist)
router.post('/', contest.create)
router.put('/:cid', contest.update)
router.del('/:cid', contest.del)

module.exports = router
