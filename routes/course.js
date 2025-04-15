const Router = require('koa-router')
const course = require('../controllers/course')
const { auth } = require('../utils/middlewares')

const router = new Router({
  prefix: '/course',
})

router.get('/', course.find)
router.get('/:id', auth.login, course.preload, course.findOne)
router.post('/', auth.login, auth.root, course.create)

module.exports = router
