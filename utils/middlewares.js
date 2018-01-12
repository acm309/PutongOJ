const { isAdmin } = require('./helper')

const login = async (ctx, next) => {
  if (!ctx.session || ctx.session.profile == null) ctx.throw(401, 'Login required')
  await next()
}

const admin = async (ctx, next) => {
  if (ctx.session.profile && isAdmin(ctx.session.profile)) {
    return next()
  } else {
    ctx.throw(403, 'Permission denied')
  }
}

module.exports = {
  auth: {
    login,
    admin
  }
}
