const Router = require('@koa/router')

const router = new Router({
  prefix: '/api',
})

const contest = require('./contest')
const course = require('./course')
const discuss = require('./discuss')
const group = require('./group')
const news = require('./news')
const problem = require('./problem')
const ranklist = require('./ranklist')
const session = require('./session')
const statistics = require('./statistics')
const status = require('./status')
const tag = require('./tag')
const testcase = require('./testcase')
const user = require('./user')
const utils = require('./utils')

router.use(contest.routes(), contest.allowedMethods())
router.use(course.routes(), course.allowedMethods())
router.use(discuss.routes(), discuss.allowedMethods())
router.use(group.routes(), group.allowedMethods())
router.use(news.routes(), news.allowedMethods())
router.use(problem.routes(), problem.allowedMethods())
router.use(ranklist.routes(), ranklist.allowedMethods())
router.use(session.routes(), session.allowedMethods())
router.use(statistics.routes(), statistics.allowedMethods())
router.use(status.routes(), status.allowedMethods())
router.use(tag.routes(), tag.allowedMethods())
router.use(testcase.routes(), testcase.allowedMethods())
router.use(user.routes(), user.allowedMethods())
router.use(utils.routes(), utils.allowedMethods())

module.exports = router
