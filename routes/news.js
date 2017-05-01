const Router = require('koa-router')
const news = require('../controllers/news')
const { loginRequired, adminRequired } = require('../middlewares')

const router = new Router({
  prefix: '/news'
})

router.get('/', news.queryList)
router.get('/:nid', news.queryOneNews)
router.post('/', loginRequired, adminRequired, news.create)
router.put('/:nid', loginRequired, adminRequired, news.update)
router.del('/:nid', loginRequired, adminRequired, news.del)

module.exports = router
