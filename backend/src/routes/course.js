const Router = require('koa-router')

const {
  coursePreload,
  courseRoleRequire,
  findCourses,
  getCourse,
  createCourse,
  findCourseMembers,
  getCourseMember,
  updateCourseMember,
  removeCourseMember,
} = require('../controllers/course')
const { auth: {
  login: loginRequire,
  root: rootPrivilegeRequire,
} } = require('../middlewares')

const courseRouter = new Router({ prefix: '/course' })

// Courses
courseRouter.get('/',
  findCourses,
)
courseRouter.post('/',
  loginRequire,
  rootPrivilegeRequire,
  createCourse,
)

// Course
courseRouter.get('/:courseId',
  loginRequire,
  coursePreload,
  getCourse,
)

// Course Members
courseRouter.get('/:courseId/member',
  loginRequire,
  coursePreload,
  courseRoleRequire('manageCourse'),
  findCourseMembers,
)

// Course Member
courseRouter.get('/:courseId/member/:userId',
  loginRequire,
  coursePreload,
  courseRoleRequire('manageCourse'),
  getCourseMember,
)
courseRouter.post('/:courseId/member/:userId',
  loginRequire,
  coursePreload,
  courseRoleRequire('manageCourse'),
  updateCourseMember,
)
courseRouter.delete('/:courseId/member/:userId',
  loginRequire,
  coursePreload,
  courseRoleRequire('manageCourse'),
  removeCourseMember,
)

module.exports = courseRouter
