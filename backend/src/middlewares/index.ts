import type { Context } from 'koa'
import config from '../config'

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
