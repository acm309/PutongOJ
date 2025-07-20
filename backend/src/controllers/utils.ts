import type { Context } from 'koa'
import path from 'node:path'
import fse from 'fs-extra'
import websiteConf from '../config/website'
import { loadProfile } from '../middlewares/authn'
import logger from '../utils/logger'

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

const websiteConfig = (ctx: Context) => {
  ctx.body = {
    website: websiteConf,
  }
}

module.exports = {
  upload,
  serverTime,
  websiteConfig,
}
