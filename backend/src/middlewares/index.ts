import type { Context, Middleware } from 'koa'
import { env } from 'node:process'
import { RateLimit } from 'koa2-ratelimit'
import auth, { loadProfile } from './authn'

const handler = async function (ctx: Context) {
  ctx.status = 429
}

const skipIfTest = (middleware: Middleware): Middleware => {
  return (ctx: Context, next: () => Promise<any>) => {
    if (env.NODE_ENV === 'test') {
      return next()
    }
    return middleware(ctx, next)
  }
}

export const solutionCreateRateLimit = skipIfTest(
  RateLimit.middleware({
    interval: { sec: 5 },
    max: 1,
    async keyGenerator (ctx: Context) {
      const profile = await loadProfile(ctx)
      return `solutions/${profile.uid}`
    },
    handler,
  }))

export const userRegisterRateLimit = skipIfTest(
  RateLimit.middleware({
    interval: { min: 1 },
    max: 1,
    prefixKey: 'user',
    handler,
  }))

export const commentCreateRateLimit = skipIfTest(
  RateLimit.middleware({
    interval: { sec: 5 },
    max: 1,
    async keyGenerator (ctx) {
      const profile = await loadProfile(ctx)
      return `comments/${profile.uid}`
    },
    handler,
  }))

export default {
  solutionCreateRateLimit,
  userRegisterRateLimit,
  commentCreateRateLimit,
  auth,
}
