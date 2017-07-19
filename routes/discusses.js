const Router = require('koa-router')
const discusses = require('../controllers/discusses')
const { loginRequired, adminRequired } = require('../middlewares')

const router = new Router({
  prefix: '/discusses'
})

router
  .get('/', discusses.queryList)
  .get('/:did', discusses.queryOneDiscuss)
  .post('/', discusses.create)

module.exports = router
