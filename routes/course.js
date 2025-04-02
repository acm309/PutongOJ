const Router = require('koa-router')
const course = require('../controllers/course')
const { auth } = require('../utils/middlewares')

const router = new Router({
  prefix: '/course',
})

router.get('/', course.find)
router.get('/:id', auth.login, course.preload, course.findOne)

module.exports = router
