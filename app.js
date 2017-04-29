const Koa = require('koa')
const config = require('./config')

const app = new Koa()

// inject the config
app.use(async function (ctx, next) {
  ctx.config = config
  await next()
})

app.use(async function (ctx, next) {
  ctx.body = 'hello koa'
  await next()
})

app.listen(3000)
