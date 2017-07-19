const Router = require('koa-router')
const comments = require('../controllers/comments')

const router = new Router({
  prefix: '/comments'
})

router
  .post('/', comments.create)

module.exports = router
