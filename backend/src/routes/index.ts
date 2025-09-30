import Router from '@koa/router'

import admin from './admin'
import contest from './contest'
import course from './course'
import discuss from './discuss'
import group from './group'
import news from './news'
import oauth from './oauth'
import problem from './problem'
import ranklist from './ranklist'
import session from './session'
import solution from './solution'
import tag from './tag'
import testcase from './testcase'
import user from './user'
import utils from './utils'

const router = new Router({
  prefix: '/api',
})

router.use(admin.routes(), admin.allowedMethods())
router.use(contest.routes(), contest.allowedMethods())
router.use(course.routes(), course.allowedMethods())
router.use(discuss.routes(), discuss.allowedMethods())
router.use(group.routes(), group.allowedMethods())
router.use(news.routes(), news.allowedMethods())
router.use(oauth.routes(), oauth.allowedMethods())
router.use(problem.routes(), problem.allowedMethods())
router.use(ranklist.routes(), ranklist.allowedMethods())
router.use(session.routes(), session.allowedMethods())
router.use(solution.routes(), solution.allowedMethods())
router.use(tag.routes(), tag.allowedMethods())
router.use(testcase.routes(), testcase.allowedMethods())
router.use(user.routes(), user.allowedMethods())
router.use(utils.routes(), utils.allowedMethods())

export default router
