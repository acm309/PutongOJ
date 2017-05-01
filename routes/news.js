const Router = require('koa-router')
const news = require('../controllers/news')

const router = new Router({
  prefix: '/news'
})

router.get('/', news.queryList)
router.get('/:nid', news.queryOneNews)
router.post('/', news.create)
router.put('/:nid', news.update)

module.exports = router
