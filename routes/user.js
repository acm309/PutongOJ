const user = require('../controllers/user')
const Router = require('koa-router')

const router = new Router({
  prefix: '/user'
})

router.get('/list', user.find)
router.get('/:uid', user.preload, user.findOne)

// register
router.post('/', user.create)
router.put('/:uid', user.preload, user.update)

module.exports = router
