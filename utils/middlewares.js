const login = async (ctx, next) => {
  if (!ctx.session || ctx.session.profile == null) ctx.throw(401, 'Login required')
  await next()
}

const admin = async (ctx, next) => {
  // TODO 判断一个用户是不是 admin
  if (ctx) await next()
}

module.exports = {
  auth: {
    login,
    admin
  }
}
