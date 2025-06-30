const Router = require('koa-router')
const discuss = require('../controllers/discuss')
const { auth, commentCreateRateLimit } = require('../middlewares')

const router = new Router({
  prefix: '/discuss',
})

router.get('/list', auth.login, discuss.find)
router.get('/:did', auth.login, discuss.preload, discuss.findOne)
router.post('/', auth.login, commentCreateRateLimit, discuss.create)
router.put('/:did', auth.login, commentCreateRateLimit, discuss.preload, discuss.update)
router.del('/:did', auth.login, auth.admin, discuss.del)

module.exports = router
