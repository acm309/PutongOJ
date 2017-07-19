const Router = require('koa-router')
const discusses = require('../controllers/discusses')
const { loginRequired } = require('../middlewares')

const router = new Router({
  prefix: '/discusses'
})

router
  .get('/', discusses.queryList)
  .get('/:did', discusses.queryOneDiscuss)
  .post('/', loginRequired, discusses.create)

module.exports = router
