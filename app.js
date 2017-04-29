const Koa = require('koa')
const serve = require('koa-static')
const logger = require('koa-logger')
const convert = require('koa-convert')
const staticCache = require('koa-static-cache')

const path = require('path')

const config = require('./config')

const app = new Koa()

// inject the config
app.use(async function (ctx, next) {
  ctx.config = config
  await next()
})

app.use(logger())

app.use(convert(staticCache(path.resolve(__dirname, 'public'), {
  maxAge: 7 * 24 * 60 * 60
})))

app.use(serve('public'))

app.listen(config.port)
