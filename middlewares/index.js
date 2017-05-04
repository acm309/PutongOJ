async function loginRequired (ctx, next) {
  if (!ctx.session.user) {
    ctx.throw(400, 'Please Login first')
  }
  await next()
}

async function adminRequired (ctx, next) {
  if (ctx.session.user.privilege !== ctx.config.privilege.Admin) {
    ctx.throw(400, 'Only admins are allowed to do this')
  }
  await next()
}

function idNumberRequired (item) {
  return async function (ctx, next) {
    if (isNaN(+ctx.params[item])) {
      ctx.throw(400, `${item} should be a number`)
    }
    await next()
  }
}

module.exports = {
  loginRequired,
  adminRequired,
  idNumberRequired
}
