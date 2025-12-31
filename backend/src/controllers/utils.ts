import type { OAuthProvider } from '@putongoj/shared'
import type { Context } from 'koa'
import path from 'node:path'
import fse from 'fs-extra'
import { v4 } from 'uuid'
import { globalConfig } from '../config'
import redis from '../config/redis'
import websiteConf from '../config/website'
import { loadProfile } from '../middlewares/authn'
import cryptoService from '../services/crypto'
import { createEnvelopedResponse } from '../utils'

export interface WebsiteInformation {
  title: string
  buildSHA: string
  buildTime: number
  apiPublicKey: string
  oauthEnabled: Record<OAuthProvider, boolean>
  helpDocURL?: string
}

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

const websiteInformation = async (ctx: Context) => {
  const result: WebsiteInformation = {
    ...websiteConf,
    apiPublicKey: await cryptoService.getServerPublicKey(),
    oauthEnabled: {
      CJLU: globalConfig.oauthConfigs.CJLU.enabled,
      Codeforces: globalConfig.oauthConfigs.Codeforces.enabled,
    },
    helpDocURL: globalConfig.helpDocURL,
  }
  ctx.body = result
}

export async function getWebSocketToken (ctx: Context) {
  const profile = await loadProfile(ctx)
  const token = v4()
  await redis.setex(`websocket:token:${token}`, 10, profile.uid)
  return createEnvelopedResponse(ctx, { token })
}

const utilsController = {
  upload,
  serverTime,
  websiteInformation,
  getWebSocketToken,
} as const

export default utilsController
