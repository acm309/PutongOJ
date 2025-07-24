const Router = require('@koa/router')
const tag = require('../controllers/tag')
const { auth } = require('../middlewares')

const router = new Router({
  prefix: '/tag',
})

router.get('/list', tag.find)
router.post('/', auth.login, auth.admin, tag.create)
router.get('/:tid', tag.preload, tag.findOne)
router.put('/:tid', auth.login, auth.admin, tag.preload, tag.update)
router.del('/:tid', auth.login, auth.admin, tag.preload, tag.del)

module.exports = router
