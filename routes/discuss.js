const Router = require('koa-router')
const discuss = require('../controllers/discuss')
const { auth } = require('../utils/middlewares')

const router = new Router({
  prefix: '/discuss',
})

router.get('/list', discuss.find)
router.get('/:did', discuss.preload, discuss.findOne)
router.post('/', auth.login, discuss.create)
router.put('/:did', auth.login, discuss.preload, discuss.update)
router.del('/:did', auth.login, auth.admin, discuss.del)

module.exports = router
