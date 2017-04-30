const User = require('../models/User')
const { extractPagination } = require('../utils')

async function ranklist (ctx, next) {
  const res = await User
    .paginate({}, {
      limit: +ctx.query.limit || 30, // 加号表示使其变为数字
      page: +ctx.query.page || 1,
      sort: {solve: -1, submit: 1},
      // '-_id' 结果不包含 _id
      // http://stackoverflow.com/questions/9598505/mongoose-retrieving-data-without-id-field
      select: '-_id uid nick motto solve submit'
    })

  ctx.body = {
    users: res.docs,
    pagination: extractPagination(res)
  }
}

module.exports = {
  ranklist
}
