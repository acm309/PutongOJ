const user = require('../controllers/user')
const Router = require('koa-router')

const router = new Router({
  prefix: '/user'
})

router.get('/:uid', user.findOne)

// register
router.post('/', user.create)
router.put('/:uid', user.update)

module.exports = router
