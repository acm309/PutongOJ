const User = require('../models/User')

async function queryOneUser (ctx, next) {
  const uid = ctx.params.uid

  const user = await User
    .findOne({uid})
    .select('-_id uid nick solve submit status timerecord iprecord school mail motto privilege')
    .exec()

  if (!user) {
    ctx.throw(400, 'No such a user')
  }

  ctx.body = {
    user
  }
}

module.exports = {
  queryOneUser
}
