import type { Context } from 'koa'
import { randomUUID } from 'node:crypto'
import { env } from 'node:process'
import Router from '@koa/router'
import { AvatarPresetsQueryResultSchema, PublicConfigQueryResultSchema } from '@putongoj/shared'
import { globalConfig } from '../config'
import redis from '../config/redis'
import { loadProfile, loginRequire } from '../middlewares/authn'
import cryptoService from '../services/crypto'
import { settingsService } from '../services/settings'
import { createEnvelopedResponse } from '../utils'

function parseBuildTime (): Date | null {
  const buildTimeStr = env.NODE_BUILD_TIME
  if (!buildTimeStr) {
    return null
  }
  const timestamp = Date.parse(buildTimeStr)
  if (Number.isNaN(timestamp)) {
    return null
  }
  return new Date(timestamp)
}

const commitHash = env.NODE_BUILD_SHA || 'unknown'
const buildAt = parseBuildTime()

const serverTime = (ctx: Context) => {
  ctx.body = {
    serverTime: Date.now(),
  }
}

export async function getPublicConfig (ctx: Context) {
  const { helpDocURL, oauthConfigs, umamiAnalytics } = globalConfig
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
    helpDocURL,
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
  return createEnvelopedResponse(ctx, { token })
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
