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
const appRouter = require('./routes')

const app = new Koa()

// 注入 config，在后续路由或中间件中，可以直接使用 ctx.config 访问
app.use(async function (ctx, next) {
  ctx.config = config
  await next()
})

// 日志，会在控制台显示请求的方法和路由
app.use(logger())

// 上传文件的文件夹地址
app.use(koaBody({
  formidable: {
    uploadDir: path.resolve(__dirname, 'public/uploads')
  },
  multipart: true,
  urlencoded: true
}))

app.use(convert(staticCache(path.resolve(__dirname, 'public'), {
  maxAge: 7 * 24 * 60 * 60 // 7 天不更新，也就是缓存期限
})))

app.use(serve('public'))

app.keys = ['FlandreScarlet'] // session 加密需要

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

// 错误报告，controller 提出的错务必提供 message，只有未知的错误才会显示 "Unknown..."
app.use(async function (ctx, next) {
  try {
    await next()
  } catch (err) {
    ctx.status = err.status || 500
    ctx.body = {
      error: err.message || 'Unknown message, please contact the admin'
    }
  }
})

appRouter(app)

console.log(`listening on port ${config.port}`)

app.listen(config.port)
