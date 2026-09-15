import type { Context, Middleware } from 'koa'
import ratelimit from 'koa-ratelimit'
import config from '../config'
import redis from '../config/redis'

function createRatelimitMiddleware (
  duration: number,
  max: number,
  id: (ctx: Context) => string,
): Middleware {
  if (config.disableRateLimit) {
    return async (_, next) => { await next() }
  }
  return ratelimit({
    driver: 'redis',
    db: redis as any,
    duration: duration * 1000,
    errorMessage: 'Rate limit exceeded, please try again later.',
    id: id as any,
    max,
  }) as any
}

export function limitByIp (prefixKey: string, duration: number, max: number) {
  return createRatelimitMiddleware(duration, max, (ctx) => {
    return `${prefixKey}:${ctx.state.clientIp.replace(/:/g, '_')}`
  })
}

export function limitByUser (prefixKey: string, duration: number, max: number) {
  return createRatelimitMiddleware(duration, max, (ctx) => {
    const username = ctx.state.profile?.uid || 'anonymous'
    return `${prefixKey}:${username}`
  })
}

export const userLoginLimit = limitByIp('user_login', 60, 10)
export const userRegisterLimit = limitByIp('user_register', 300, 5)
export const solutionCreateLimit = limitByUser('solution_create', 5, 1)
export const commentCreateLimit = limitByUser('comment_create', 30, 3)
export const discussionCreateLimit = limitByUser('discussion_create', 30, 1)
export const dataExportLimit = limitByUser('data_export', 5, 1)

const ratelimitMiddleware = {
  limitByIp,
  limitByUser,
  userLoginLimit,
  userRegisterLimit,
  solutionCreateLimit,
  commentCreateLimit,
  discussionCreateLimit,
  dataExportLimit,
} as const

export default ratelimitMiddleware
