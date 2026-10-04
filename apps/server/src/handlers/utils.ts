import type { Context } from 'koa'
import { env } from 'node:process'
import Router from '@koa/router'
import {
  AvatarPresetsQueryResultSchema,
  NotificationTokenQueryResultSchema,
  PublicConfigQueryResultSchema,
  ServerTimeQueryResultSchema,
} from '@putong-oj/shared'
import { globalConfig } from '../config/index.ts'
import { loadProfile, loginRequire } from '../middlewares/authn.ts'
import cryptoService from '../services/crypto.ts'
import notificationService from '../services/notification.ts'
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

export async function getNotificationToken (ctx: Context) {
  const profile = await loadProfile(ctx)
  const token = await notificationService.createNotificationToken(profile._id.toString(), ctx.state.sessionId!)
  const result = NotificationTokenQueryResultSchema.encode({ token })
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
  utilsRouter.get('/notifications/token', loginRequire, getNotificationToken)
  utilsRouter.get('/utils/avatar-presets', loginRequire, getAvatarPresets)

  router.use(utilsRouter.routes(), utilsRouter.allowedMethods())
}

export default registerUtilsHandlers
