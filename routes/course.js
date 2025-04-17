const Router = require('koa-router')
const course = require('../controllers/course')
const { auth } = require('../utils/middlewares')

const router = new Router({
  prefix: '/course',
})

router.get('/', course.findCourses)
router.get('/:id', auth.login, course.preload, course.findCourse)
router.post('/', auth.login, auth.root, course.createCourse)

module.exports = router
