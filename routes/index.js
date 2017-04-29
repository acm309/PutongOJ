const Router = require('koa-router')
const api = new Router()

module.exports = function (app) {
  app.use(api.routes())
    .use(api.allowedMethods())
}
