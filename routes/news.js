const news = require('../controllers/news.js')
const Router = require('koa-router')

const router = new Router({
  prefix: '/news'
})

router.get('/list', news.list)
router.get('/:nid', news.findOne)

module.exports = router
