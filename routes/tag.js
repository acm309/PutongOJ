const Router = require('koa-router')
const tag = require('../controllers/tag')
const { auth } = require('../utils/middlewares')

const router = new Router({
  prefix: '/tag'
})

router.get('/list', tag.find)
router.get('/:tid', tag.preload, tag.findOne)
router.put('/:tid', auth.login, auth.admin, tag.preload, tag.update)

module.exports = router
