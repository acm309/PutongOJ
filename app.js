const Koa = require('koa')
const serve = require('koa-static')
const logger = require('koa-logger')
const convert = require('koa-convert')
const staticCache = require('koa-static-cache')
const koaBody = require('koa-body')
const session = require('koa-session-minimal')
const redisStore = require('koa-redis')

const path = require('path')

const config = require('./config')

const app = new Koa()

// inject the config
app.use(async function (ctx, next) {
  ctx.config = config
  await next()
})

app.use(logger())

app.use(koaBody({
  formidable: {
    uploadDir: path.resolve(__dirname, 'public/uploads')
  },
  multipart: true,
  urlencoded: true
}))

app.use(convert(staticCache(path.resolve(__dirname, 'public'), {
  maxAge: 7 * 24 * 60 * 60
})))

app.use(serve('public'))

app.keys = ['FlandreScarlet']

app.use(session({
  store: redisStore({
    url: config.redisUrl
  }),
  cookie: {
    path: '/',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    rewrite: true,
    signed: true
  }
}))

console.log(`listening on port ${config.port}`)

app.listen(config.port)
