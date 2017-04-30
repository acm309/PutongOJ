/** 返回服务器时间 */
async function servertime (ctx, next) {
  ctx.body = {
    servertime: Date.now()
  }
}

module.exports = {
  servertime
}
