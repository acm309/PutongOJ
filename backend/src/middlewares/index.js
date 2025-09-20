const { env } = require('node:process')
const { RateLimit } = require('koa2-ratelimit')
const auth = require('./authn')

const handler = async function (ctx) {
  ctx.status = 429
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

const userRegisterRateLimit = skipIfTest(
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
  userRegisterRateLimit,
  commentCreateRateLimit,
  auth,
}
