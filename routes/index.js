const Router = require('koa-router')
const api = new Router()

const contests = require('./contests')
const problems = require('./problems')
const news = require('./news')
const home = require('./home')
const users = require('./users')
const ranklist = require('./ranklist')
const status = require('./status')
const statistics = require('./statistics')
const session = require('./session')
const testdata = require('./testdata')

api
  .use('/api', contests.routes(), contests.allowedMethods())
  .use('/api', problems.routes(), problems.allowedMethods())
  .use('/api', news.routes(), news.allowedMethods())
  .use('/api', home.routes(), home.allowedMethods())
  .use('/api', users.routes(), users.allowedMethods())
  .use('/api', ranklist.routes(), ranklist.allowedMethods())
  .use('/api', status.routes(), status.allowedMethods())
  .use('/api', statistics.routes(), statistics.allowedMethods())
  .use('/api', session.routes(), session.allowedMethods())

module.exports = function () {
  return async function (ctx, next) {
    ctx.app
      .use(api.routes())
      .use(api.allowedMethods())
      .use(testdata.routes())
      .use(testdata.allowedMethods())
    return next()
  }
}
