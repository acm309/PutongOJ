import path from 'node:path'
import process, { env } from 'node:process'
import Koa from 'koa'
import { koaBody } from 'koa-body'
import koaLogger from 'koa-logger'
import session from 'koa-session'
import staticServe from 'koa-static'
import config from './config'
import redis from './config/redis'
import { databaseSetup } from './config/setup'
import {
  errorHandler,
  parseClientIp,
  setupAuditLog,
  setupRequestContext,
  spaFallback,
} from './middlewares'
import router from './routes'
import logger from './utils/logger'
import './config/db'

const app = new Koa()

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

app.use(staticServe(path.join(__dirname, '..', 'public'), {
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
  app.listen(config.port, async () => {
    await databaseSetup()
    logger.info(`The server is running at http://localhost:${config.port}`)
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
