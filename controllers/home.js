const path = require('path')

/** 返回服务器时间 */
async function servertime (ctx, next) {
  ctx.body = {
    servertime: Date.now()
  }
}

async function submit (ctx, next) {
  const filename = path.basename(ctx.request.body.files.file.path)
  ctx.body = {
    path: '/uploads/' + filename
  }
}

module.exports = {
  servertime,
  submit
}
