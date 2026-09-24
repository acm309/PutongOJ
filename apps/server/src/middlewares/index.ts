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

  let clientIp = remoteIp
  if (reverseProxy.trust) {
    const forwardedFor = ctx.get(reverseProxy.ipHeader)
    if (forwardedFor) {
      const [ forwardedIp ] = forwardedFor.split(',')
      clientIp = forwardedIp.trim() || remoteIp
    }
  }

  ctx.state.clientIp = clientIp
  await next()
}

export async function setupAuditLog (ctx: Context, next: Next) {
  const getTraceInfo = () => {
    const { requestId, clientIp, sessionId } = ctx.state
    return { requestId, clientIp, sessionId }
  }

  ctx.auditLog = {
    info (message: string) {
      logger.info(getTraceInfo(), message)
    },
    warn (message: string) {
      logger.warn(getTraceInfo(), message)
    },
    error (message: string, error?: any) {
      const trace = getTraceInfo()
      if (error) {
        logger.error({ ...trace, err: error }, message)
      } else {
        logger.error(trace, message)
      }
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
