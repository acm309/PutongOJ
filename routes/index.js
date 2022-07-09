const Router = require('koa-router')
const urlJoin = require('url-join')
const website = require('../config/website')

if (website.semi_restful) {
  Router.prototype.put = function (...args) {
    let [ name, path, middleware ] = args
    if (typeof path === 'string' || path instanceof RegExp) {
      middleware = Array.prototype.slice.call(args, 2)
    } else {
      middleware = Array.prototype.slice.call(args, 1)
      path = name
      name = null
    }
    return this.post(urlJoin(path, '/update'), ...middleware)
  }

  Router.prototype.del = function (...args) {
    let [ name, path, middleware ] = args
    if (typeof path === 'string' || path instanceof RegExp) {
      middleware = Array.prototype.slice.call(args, 2)
    } else {
      middleware = Array.prototype.slice.call(args, 1)
      path = name
      name = null
    }
    return this.post(urlJoin(path, '/delete'), ...middleware)
  }
}

const router = new Router({
  prefix: '/api',
})

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
const testcase = require('./testcase')
const tag = require('./tag')
const discuss = require('./discuss')

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
router.use(testcase.routes(), testcase.allowedMethods())
router.use(tag.routes(), tag.allowedMethods())
router.use(discuss.routes(), discuss.allowedMethods())

module.exports = router
