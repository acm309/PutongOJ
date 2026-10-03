import type { Context } from 'koa'
import path from 'node:path'
import process, { env } from 'node:process'
import Koa from 'koa'
import { koaBody } from 'koa-body'
import koaLogger from 'koa-logger'
import session from 'koa-session'
import staticServe from 'koa-static'
import config from './config/index.ts'
import redis from './config/redis.ts'
import { databaseSetup } from './config/setup.ts'
import {
  errorHandler,
  parseClientIp,
  setupAuditLog,
  setupRequestContext,
  spaFallback,
} from './middlewares/index.ts'
import router from './routes.ts'
import { createLogger } from './utils/logger.ts'
import './config/db.ts'

const logger = createLogger('server')
const app = new Koa()

// Errors the client causes by going away before the response is finished.
// Koa's default error handler prints these as raw stacks through console.error,
// which is noisy and bypasses pino, so handle the event ourselves.
const CLIENT_ABORT_ERROR_CODES = new Set([
  'ECONNRESET',
  'EPIPE',
  'ERR_STREAM_PREMATURE_CLOSE',
])

app.on('error', (err: NodeJS.ErrnoException, ctx?: Context) => {
  const trace = {
    err,
    requestId: ctx?.state?.requestId,
    method: ctx?.method,
    path: ctx?.path,
  }

  if (err.code && CLIENT_ABORT_ERROR_CODES.has(err.code)) {
    logger.debug(trace, 'Client aborted the response')
    return
  }

  logger.error(trace, 'Unhandled server error')
})

// Logger for development, will show the method and route in the console
// Not used in production for better performance
if (env.NODE_ENV === 'development') {
  app.use(koaLogger())
}

app.keys = [ config.secretKey ]

app.use(parseClientIp)
app.use(setupAuditLog)

app.use(session({
  key: 'ptoj.session',
  maxAge: config.sessionMaxAge * 1000,
  signed: true,
  renew: true,
}, app))

app.use(koaBody({
  jsonLimit: '8mb', // Limit JSON body to 8MB
  formLimit: '8mb', // Limit form body to 8MB
  textLimit: '8mb', // Limit text body to 8MB
  multipart: true, // Enable multipart for file uploads
  formidable: {
    maxFileSize: 4 * 1024 * 1024, // Limit file size to 4MB
  },
}))

app.use(staticServe(path.join(import.meta.dirname, '..', 'public'), {
  gzip: true,
  maxage: 7 * 24 * 60 * 60, // 1 week
}))

app.use(setupRequestContext)
app.use(errorHandler)
app.use(spaFallback)

app.use(router.routes()).use(router.allowedMethods())

// If not in test environment, start the server and listen on the specified port
// In test environment, we will export the app without starting the server,
// and let the test framework handle it
if (env.NODE_ENV !== 'test') {
  databaseSetup()
    .then(() => {
      app.listen(config.port, () => {
        logger.info(`The server is running at http://localhost:${config.port}`)
      })
    })
    .catch((err) => {
      logger.error({ err }, 'Database setup failed')
      process.exit(-1)
    })

  async function shutdown (signal: string) {
    logger.info(`Received ${signal}, shutting down...`)
    await redis.quit()
    logger.info('Redis connection closed')
    process.exit(0)
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
}

export default app
