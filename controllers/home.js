async function servertime (ctx, next) {
  ctx.body = {
    servertime: Date.now()
  }
}

module.exports = {
  servertime
}
