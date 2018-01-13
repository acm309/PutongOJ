const news = require('../controllers/news.js')
const Router = require('koa-router')
const { auth } = require('../utils/middlewares')

const router = new Router({
  prefix: '/news'
})

router.get('/list', news.find)
router.get('/:nid', news.preload, news.findOne)
router.post('/', auth.admin, news.create)
router.put('/:nid', auth.admin, news.preload, news.update)
router.del('/:nid', news.del)

module.exports = router
