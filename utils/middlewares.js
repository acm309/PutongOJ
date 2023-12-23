const { RateLimit } = require('koa2-ratelimit')
const { isAdmin, isRoot } = require('./helper')

const login = async (ctx, next) => {
  if (!ctx.session || ctx.session.profile == null) { ctx.throw(401, 'Login required') }
  await next()
}

const admin = async (ctx, next) => {
  if (ctx.session.profile && isAdmin(ctx.session.profile)) {
    return next()
  } else {
    ctx.throw(403, 'Permission denied')
  }
}

const root = async (ctx, next) => {
  if (ctx.session.profile && isRoot(ctx.session.profile)) {
    return next()
  } else {
    ctx.throw(403, 'Permission denied')
  }
}

const handler = async function (ctx) {
  ctx.status = 429
  ctx.body = {
    error: '请求次数过高，请过一会重试',
  }
  if (this.options && this.options.headers) {
    ctx.set('Retry-After', Math.ceil(this.options.interval / 1000))
  }
}

const solutionCreateRateLimit = RateLimit.middleware({
  interval: { min: 1 },
  max: 60,
  async keyGenerator (ctx) {
    const opt = ctx.request.body
    return `solutions/${opt.pid}| ${ctx.request.ip} `
  },
  handler,
})

const userCreateRateLimit = RateLimit.middleware({
  interval: { min: 1 },
  max: 30,
  prefixKey: 'user',
  handler,
})

module.exports = {
  solutionCreateRateLimit,
  userCreateRateLimit,
  auth: {
    login,
    admin,
    root,
  },
}
