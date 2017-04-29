const koa = require('koa')

const app = new koa()

app.use(async function (ctx, next) {
  ctx.body = "hello koa"
})

app.listen(3000)
