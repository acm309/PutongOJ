const Router = require('koa-router')
const contest = require('../controllers/contest')
const { auth } = require('../utils/middlewares')

const router = new Router({ prefix: '/contest' })

router.get('/list', contest.find)
router.get('/:cid', auth.login, contest.preload, contest.findOne)
router.get('/:cid/ranklist', auth.login, contest.preload, contest.ranklist)
router.post('/', auth.login, auth.admin, contest.create)
router.put('/:cid', auth.login, auth.admin, contest.update)
router.del('/:cid', auth.login, auth.admin, contest.del)
router.post('/:cid/verify', auth.login, contest.verify)

module.exports = router
