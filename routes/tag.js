const Router = require('koa-router')
const tag = require('../controllers/tag')
const { auth } = require('../utils/middlewares')

const router = new Router({
  prefix: '/tag'
})

router.get('/list', tag.find)
router.get('/:tid', tag.preload, tag.findOne)
// router.post('/', auth.login, auth.admin, tag.create)
router.put('/:tid', auth.login, auth.admin, tag.preload, tag.update)
router.del('/:tid', auth.login, auth.admin, tag.preload, tag.del)

module.exports = router
