import type { DefaultContext, DefaultState } from 'koa'
import Router from 'koa-router'
import courseController from '../controllers/course'
import authnMiddleware from '../middlewares/authn'

const courseRouter = new Router<DefaultState, DefaultContext>({
  prefix: '/course',
})

courseRouter.get('/',
  courseController.findCourses,
)
courseRouter.post('/',
  authnMiddleware.rootRequire,
  courseController.createCourse,
)
courseRouter.get('/:courseId',
  authnMiddleware.loginRequire,
  courseController.getCourse,
)
courseRouter.get('/:courseId/member',
  authnMiddleware.loginRequire,
  courseController.findCourseMembers,
)
courseRouter.get('/:courseId/member/:userId',
  authnMiddleware.loginRequire,
  courseController.getCourseMember,
)
courseRouter.post('/:courseId/member/:userId',
  authnMiddleware.loginRequire,
  courseController.updateCourseMember,
)
courseRouter.delete('/:courseId/member/:userId',
  authnMiddleware.loginRequire,
  courseController.removeCourseMember,
)

export default module.exports = courseRouter
