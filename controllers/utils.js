const path = require('node:path')
const fse = require('fs-extra')
const websiteConf = require('../config/website')
const logger = require('../utils/logger')

const uploadDir = path.join(__dirname, '../public/uploads')

const upload = async (ctx) => {
  const file = ctx.request.body.files.image
  const { profile: { uid } } = ctx.state
  if (!file) {
    ctx.throw(400, 'No file uploaded')
  }
  const filename = path.basename(file.path)
  try {
    await fse.move(file.path, path.join(uploadDir, filename))
  } catch (err) {
    ctx.throw(500, `Failed to save file: ${err.message}`)
  }
  logger.info(`File <${filename}> is uploaded by user <${uid}>`)
  ctx.body = {
    url: `/uploads/${filename}`,
  }
}

const serverTime = (ctx) => {
  ctx.body = {
    serverTime: Date.now(),
  }
}

const websiteConfig = (ctx) => {
  ctx.body = {
    website: websiteConf,
  }
}

module.exports = {
  upload,
  serverTime,
  websiteConfig,
}
