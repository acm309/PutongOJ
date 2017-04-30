const User = require('../models/User')
const Solution = require('../models/Solution')
const _ = require('ramda')

async function queryOneUser (ctx, next) {
  const uid = ctx.params.uid

  const user = await User
    .findOne({uid})
    .select('-_id uid nick solve submit status timerecord iprecord school mail motto privilege')
    .lean()
    .exec()

  if (!user) {
    ctx.throw(400, 'No such a user')
  }

  let solved = await Solution
    .find({uid, judge: 3}) // TODO: fix this number to a constant variable
    .distinct('pid')
    .exec()

  solved = _.sort((x, y) => (x < y ? -1 : 1), solved)

  let unsolved = await Solution
    .find({uid, judge: {$ne: 3}}) // TODO: fix this number to a constant variable
    .distinct('pid')
    .exec()

  unsolved = _.filter((pid) => !solved.includes(pid), unsolved)

  ctx.body = {
    user,
    solved,
    unsolved
  }
}

module.exports = {
  queryOneUser
}
