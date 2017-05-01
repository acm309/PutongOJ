async function loginRequired (ctx, next) {
  if (!ctx.session.user) {
    ctx.throw(400, 'Please Login first')
  }
  await next()
}

module.exports = {
  loginRequired
}
