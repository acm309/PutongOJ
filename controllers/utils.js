const fse = require('fs-extra')
const path = require('node:path')
const websiteConf = require('../config/website')
const uploadDir = path.join(__dirname, '../public/uploads')

const upload = async (ctx) => {
  const file = ctx.request.body.files.image
  if (!file) {
    ctx.throw(400, 'No file uploaded')
  }
  const filename = path.basename(file.path)
  try {
    await fse.move(file.path, path.join(uploadDir, filename))
  } catch (err) {
    ctx.throw(500, `Failed to save file: ${err.message}`)
  }
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
