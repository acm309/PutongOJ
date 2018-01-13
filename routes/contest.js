const contest = require('../controllers/contest.js')
const Router = require('koa-router')
const { auth } = require('../utils/middlewares')

const router = new Router({
  prefix: '/contest'
})

router.get('/list', contest.list)
router.get('/:cid', contest.findOne)
router.get('/:cid/rank', contest.ranklist)
router.post('/', auth.admin, contest.create)
router.put('/:cid', auth.admin, contest.update)
router.del('/:cid', auth.admin, contest.del)

module.exports = router
