const Router = require('koa-router')

const router = new Router()

const session = require('./session')
const problem = require('./problem')
const news = require('./news')
const status = require('./status')
const user = require('./user')
const statistics = require('./statistics')
const ranklist = require('./ranklist')
const contest = require('./contest')
const group = require('./group')
const utils = require('./utils')

router.use(session.routes(), session.allowedMethods()) // allowedMethods:当前接口运行的method
router.use(problem.routes(), problem.allowedMethods())
router.use(news.routes(), news.allowedMethods())
router.use(status.routes(), status.allowedMethods())
router.use(user.routes(), user.allowedMethods())
router.use(statistics.routes(), statistics.allowedMethods())
router.use(ranklist.routes(), ranklist.allowedMethods())
router.use(contest.routes(), contest.allowedMethods())
router.use(group.routes(), group.allowedMethods())
router.use(utils.routes(), utils.allowedMethods())

module.exports = router
