import type { Context } from 'koa'
import path from 'node:path'
import { env } from 'node:process'
import { AvatarPresetsQueryResultSchema, PublicConfigQueryResultSchema } from '@putongoj/shared'
import fse from 'fs-extra'
import { v4 } from 'uuid'
import { globalConfig } from '../config'
import redis from '../config/redis'
import { loadProfile } from '../middlewares/authn'
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

const uploadDir = path.join(__dirname, '../../public/uploads')

const upload = async (ctx: Context) => {
  const { uid } = await loadProfile(ctx)
  if (!ctx.request.files || !ctx.request.files.image) {
    ctx.throw(400, 'No file uploaded')
  }
  const file = ctx.request.files.image
  if (Array.isArray(file)) {
    ctx.throw(400, 'Invalid file uploaded')
  }
  if (!file) {
    ctx.throw(400, 'No file uploaded')
  }
  const filename = path.basename(file.filepath)
  try {
    await fse.move(file.filepath, path.join(uploadDir, filename))
  } catch (err: any) {
    ctx.throw(500, `Failed to save file: ${err.message}`)
  }
  ctx.auditLog.info(`<File:${filename}> uploaded by <User:${uid}>`)
  ctx.body = {
    url: `/uploads/${filename}`,
  }
}

const serverTime = (ctx: Context) => {
  ctx.body = {
    serverTime: Date.now(),
  }
}

export async function getPublicConfig (ctx: Context) {
  const { helpDocURL, oauthConfigs } = globalConfig
  const apiPublicKey = await cryptoService.getServerPublicKey()
  const result = PublicConfigQueryResultSchema.encode({
    name: 'Putong OJ',
    backendVersion: {
      commitHash,
      buildAt: buildAt || new Date(),
    },
    apiPublicKey,
    oauthEnabled: {
      CJLU: oauthConfigs.CJLU.enabled,
      Codeforces: oauthConfigs.Codeforces.enabled,
    },
    helpDocURL,
  })
  return createEnvelopedResponse(ctx, result)
}

export async function getWebSocketToken (ctx: Context) {
  const profile = await loadProfile(ctx)
  const token = v4()
  await redis.setex(`websocket:token:${token}`, 10, profile.uid)
  return createEnvelopedResponse(ctx, { token })
}

export async function getAvatarPresets (ctx: Context) {
  const presets = await settingsService.getAvatarPresets()
  const result = AvatarPresetsQueryResultSchema.parse(presets)
  return createEnvelopedResponse(ctx, result)
}

const utilsController = {
  upload,
  serverTime,
  getPublicConfig,
  getWebSocketToken,
  getAvatarPresets,
} as const

export default utilsController
