import type { Context } from 'koa'
import type { OAuthProvider } from '../services/oauth'
import path from 'node:path'
import fse from 'fs-extra'
import { globalConfig } from '../config'
import websiteConf from '../config/website'
import { loadProfile } from '../middlewares/authn'
import cryptoService from '../services/crypto'
import logger from '../utils/logger'

export interface WebsiteInformation {
  title: string
  buildSHA: string
  buildTime: number
  apiPublicKey: string
  oauthEnabled: Record<OAuthProvider, boolean>
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
  logger.info(`File <${filename}> is uploaded by user <${uid}>`)
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
    },
  }
  ctx.body = result
}

export default {
  upload,
  serverTime,
  websiteInformation,
}
