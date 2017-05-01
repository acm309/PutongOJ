const Router = require('koa-router')
const news = require('../controllers/news')
const { loginRequired } = require('../middlewares')

const router = new Router({
  prefix: '/news'
})

router.get('/', news.queryList)
router.get('/:nid', news.queryOneNews)
router.post('/', loginRequired, news.create)
router.put('/:nid', loginRequired, news.update)

module.exports = router
