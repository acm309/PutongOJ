const Router = require('@koa/router')
const news = require('../controllers/news')
const { auth } = require('../middlewares')

const router = new Router({
  prefix: '/news',
})

router.get('/list', news.find)
router.get('/:nid', news.preload, news.findOne)
router.post('/', auth.login, auth.admin, news.create)
router.put('/:nid', auth.login, auth.admin, news.preload, news.update)
router.del('/:nid', auth.login, news.del)

module.exports = router
