const Router = require('koa-router')
const news = require('../controllers/news')

const router = new Router({
  prefix: '/news'
})

router.get('/', news.queryList)
router.get('/:nid', news.queryOneNews)

module.exports = router
