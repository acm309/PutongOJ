import type { Context, Next } from 'koa'
import path from 'node:path'
import { ErrorCode, ErrorCodeValues } from '@putong-oj/shared'
import send from 'koa-send'
import config from '../config/index.ts'
import { createErrorResponse } from '../utils/index.ts'
import { createLogger } from '../utils/logger.ts'
import authnMiddleware from './authn.ts'

const logger = createLogger('server.audit')

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

export async function setupAuditLog (ctx: Context, next: Next) {
  const buildTraceInfo = () => {
    const { requestId, clientIp, sessionId } = ctx.state
    const trace = [ `Req ${requestId}`, `IP ${clientIp}` ]
    if (sessionId) {
      trace.push(`Sess ${sessionId}`)
    }
    return `[${trace.join(', ')}]`
  }

  ctx.auditLog = {
    info (message: string) {
      logger.info(`${message} ${buildTraceInfo()}`)
    },
    error (message: string, error?: any) {
      const trace = buildTraceInfo()
      if (error) {
        logger.error({ err: error, trace }, message)
      } else {
        logger.error({ trace }, message)
      }
    },
    warn (message: string) {
      logger.warn(`${message} ${buildTraceInfo()}`)
    },
  }
  await next()
}

export async function setupRequestContext (ctx: Context, next: Next) {
  ctx.state.requestId = ctx.get('X-Request-ID') || 'unknown'
  await authnMiddleware.checkSession(ctx)
  await next()
}

export async function errorHandler (ctx: Context, next: Next) {
  try {
    await next()
  } catch (err: any) {
    const errorCode = ErrorCodeValues.includes(err.status)
      ? (err.status as ErrorCode)
      : ErrorCode.InternalServerError
    const message: string | undefined = err.expose ? err.message : undefined

    if (errorCode >= ErrorCode.InternalServerError) {
      ctx.auditLog.error('Unhandled server error', err)
    } else {
      ctx.auditLog.warn(`HTTP/${errorCode}: ${err.message}`)
    }

    createErrorResponse(ctx, errorCode, message)
  }
}

export async function spaFallback (ctx: Context, next: Next) {
  await next()
  if (ctx.status === 404) {
    return send(ctx, 'index.html', {
      root: path.join(import.meta.dirname, '../../public'),
    })
  }
}
