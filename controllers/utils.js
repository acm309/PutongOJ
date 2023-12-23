const path = require('node:path')
const websiteConf = require('../config/website')

const submit = (ctx) => {
  const filename = path.basename(ctx.request.body.files.image.path) // 文件名
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
  submit,
  serverTime,
  websiteConfig,
}
