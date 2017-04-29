const Router = require('koa-router')
const api = new Router()

const contests = require('./contests')

api.use('/api', contests.routes(), contests.allowedMethods())

module.exports = function (app) {
  app.use(api.routes())
    .use(api.allowedMethods())
}
