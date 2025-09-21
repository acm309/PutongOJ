import type { Context, Middleware } from 'koa'
import { env } from 'node:process'
import { RateLimit } from 'koa2-ratelimit'
import config from '../config'
import auth, { loadProfile } from './authn'

export async function parseClientIp (ctx: Context, next: () => Promise<any>) {
  const { reverseProxy } = config
  const remoteIp = ctx.socket.remoteAddress || ctx.ip
  if (!reverseProxy.enabled) {
    ctx.state.clientIp = remoteIp
    await next()
    return
  }

  const { forwardLimit } = reverseProxy
  const trustedProxies = new Set(reverseProxy.trustedProxies)
  const forwardedHeader = ctx.get(reverseProxy.forwardedForHeader)

  let ipChain: string[] = []
  if (forwardedHeader) {
    ipChain = forwardedHeader.split(',').map(s => s.trim()).filter(s => s)
  }
  ipChain.push(remoteIp)

  let forwardCount = 0
  let clientIp = remoteIp

  for (let i = ipChain.length - 1; i >= 0; i -= 1) {
    if (forwardCount >= forwardLimit) {
      clientIp = ipChain[i]
      break
    }
    if (!trustedProxies.has(ipChain[i])) {
      clientIp = ipChain[i]
      break
    }

    forwardCount += 1

    if (i === 0) {
      clientIp = ipChain[0]
    }
  }

  ctx.state.clientIp = clientIp
  await next()
}

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
  parseClientIp,
  solutionCreateRateLimit,
  userRegisterRateLimit,
  commentCreateRateLimit,
  auth,
}
