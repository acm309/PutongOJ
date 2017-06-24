const Router = require('koa-router')
const news = require('../controllers/news')
const { loginRequired, adminRequired } = require('../middlewares')

const router = new Router({
  prefix: '/news'
})

router
  .param('nid', news.validateNid)
  .get('/:nid', news.queryOneNews)
  .put('/:nid', loginRequired, adminRequired, news.update)
  .del('/:nid', loginRequired, adminRequired, news.del)

router
  .get('/', news.queryList)
  .post('/', loginRequired, adminRequired, news.create)

module.exports = router
