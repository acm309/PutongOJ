const { env } = require('node:process')
const { RateLimit } = require('koa2-ratelimit')
const authn = require('../services/authn')

const login = async (ctx, next) => {
  const isLogin = await authn.isLogin(ctx)
  if (!isLogin) {
    ctx.throw(401, 'Login required')
  }
  await next()
}

const admin = async (ctx, next) => {
  const isAdmin = await authn.isAdmin(ctx)
  if (!isAdmin) {
    ctx.throw(403, 'Permission denied')
  }
  await next()
}

const root = async (ctx, next) => {
  const isRoot = await authn.isRoot(ctx)
  if (!isRoot) {
    ctx.throw(403, 'Permission denied')
  }
  await next()
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

const skipIfTest = (middleware) => {
  return (ctx, next) => {
    if (env.NODE_ENV === 'test') {
      return next()
    }
    return middleware(ctx, next)
  }
}

const solutionCreateRateLimit = skipIfTest(
  RateLimit.middleware({
    interval: { sec: 5 },
    max: 1,
    async keyGenerator (ctx) {
      const user = ctx.session.profile
      return `solutions/${user.uid}`
    },
    handler,
  }))

const userCreateRateLimit = skipIfTest(
  RateLimit.middleware({
    interval: { min: 1 },
    max: 1,
    prefixKey: 'user',
    handler,
  }))

const commentCreateRateLimit = skipIfTest(
  RateLimit.middleware({
    interval: { sec: 5 },
    max: 1,
    async keyGenerator (ctx) {
      const user = ctx.session.profile
      return `comments/${user.uid}`
    },
    handler,
  }))

module.exports = {
  solutionCreateRateLimit,
  userCreateRateLimit,
  commentCreateRateLimit,
  auth: {
    login,
    admin,
    root,
  },
}
