const path = require('path')

const submit = (ctx) => {
  const filename = path.basename(ctx.request.body.files.image.path) // 文件名
  ctx.body = {
    url: '/uploads/' + filename
  }
}

const serverTime = (ctx) => {
  ctx.body = {
    serverTime: Date.now()
  }
}
module.exports = {
  submit,
  serverTime
}
