import type { Context } from 'koa'
import { randomUUID } from 'node:crypto'
import { env } from 'node:process'
import Router from '@koa/router'
import {
  AvatarPresetsQueryResultSchema,
  PublicConfigQueryResultSchema,
  ServerTimeQueryResultSchema,
  WebSocketTokenQueryResultSchema,
} from '@putong-oj/shared'
import { globalConfig } from '../config/index.ts'
import redis from '../config/redis.ts'
import { loadProfile, loginRequire } from '../middlewares/authn.ts'
import cryptoService from '../services/crypto.ts'
import { settingsService } from '../services/settings.ts'
import { createEnvelopedResponse } from '../utils/index.ts'

function parseBuildTime (): Date | null {
  const buildTimeStr = env.NODE_BUILD_TIME
  if (!buildTimeStr) {
    return null
  }
  const timestamp = Number.parseInt(buildTimeStr)
  if (Number.isNaN(timestamp)) {
    return null
  }
  return new Date(timestamp)
}

const commitHash = env.NODE_BUILD_SHA || 'unknown'
const buildAt = parseBuildTime()

function serverTime (ctx: Context) {
  const result = ServerTimeQueryResultSchema.encode({ serverTime: Date.now() })
  return createEnvelopedResponse(ctx, result)
}

export async function getPublicConfig (ctx: Context) {
  const { oauthConfigs, umamiAnalytics } = globalConfig
  const apiPublicKey = await cryptoService.getServerPublicKey()
  const result = PublicConfigQueryResultSchema.encode({
    name: 'Putong OJ',
    backendVersion: {
      commitHash,
      buildAt: buildAt || new Date(),
    },
    apiPublicKey,
    oauthEnabled: {
      cjlu: oauthConfigs.cjlu.enabled,
      codeforces: oauthConfigs.codeforces.enabled,
    },
    umamiAnalytics: umamiAnalytics.websiteId
      ? {
          websiteId: umamiAnalytics.websiteId,
          scriptURL: umamiAnalytics.scriptURL,
        }
      : undefined,
  })
  return createEnvelopedResponse(ctx, result)
}

export async function getWebSocketToken (ctx: Context) {
  const profile = await loadProfile(ctx)
  const token = randomUUID()
  await redis.setex(`websocket:token:${token}`, 10, profile.uid)
  const result = WebSocketTokenQueryResultSchema.encode({ token })
  return createEnvelopedResponse(ctx, result)
}

export async function getAvatarPresets (ctx: Context) {
  const presets = await settingsService.getAvatarPresets()
  const result = AvatarPresetsQueryResultSchema.parse(presets)
  return createEnvelopedResponse(ctx, result)
}

function registerUtilsHandlers (router: Router) {
  const utilsRouter = new Router()

  utilsRouter.get('/servertime', serverTime)
  utilsRouter.get('/config', getPublicConfig)
  utilsRouter.get('/websocket/token', loginRequire, getWebSocketToken)
  utilsRouter.get('/utils/avatar-presets', loginRequire, getAvatarPresets)

  router.use(utilsRouter.routes(), utilsRouter.allowedMethods())
}

export default registerUtilsHandlers
