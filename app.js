const Koa = require('koa')
const serve = require('koa-static')

const config = require('./config')

const app = new Koa()

// inject the config
app.use(async function (ctx, next) {
  ctx.config = config
  await next()
})

app.use(serve('public'))

app.listen(config.port)
