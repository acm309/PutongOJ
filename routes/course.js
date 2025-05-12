const Router = require('koa-router')
const course = require('../controllers/course')
const { auth } = require('../utils/middlewares')

const router = new Router({ prefix: '/course' })

// Courses
router.get('/', course.findCourses)
router.post('/', auth.login, auth.root, course.createCourse)

// Course
router.get('/:courseId', auth.login, course.preload, course.getCourse)

// Course Members
router.get('/:courseId/member', auth.login, course.preload, course.role('manageCourse'), course.findMembers)

// Course Member
router.get('/:courseId/member/:userId', auth.login, course.preload, course.role('manageCourse'), course.getMember)
router.post('/:courseId/member/:userId', auth.login, course.preload, course.role('manageCourse'), course.updateMember)
router.delete('/:courseId/member/:userId', auth.login, course.preload, course.role('manageCourse'), course.removeMember)

module.exports = router
