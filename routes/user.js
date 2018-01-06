const user = require('../controllers/user')
const Router = require('koa-router')

const router = new Router({
  prefix: '/user'
})

router.get('/:uid', user.findOne)

// register
router.post('/', user.create)

module.exports = router
