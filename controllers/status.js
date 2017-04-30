const Solution = require('../models/Solution')
const { extractPagination } = require('../utils')

/**
  返回一个 solution 的列表，以时间降序（从晚到早的排）
*/
async function queryList (ctx, next) {
  const filter = {}
  ;['uid', 'pid', 'judge', 'language'].forEach((item) => {
    if (typeof ctx.query[item] !== 'undefined') {
      filter[item] = ctx.query[item]
    }
  })

  const res = await Solution
    .paginate(filter, {
      limit: +ctx.query.limit || 30, // 加号表示使其变为数字
      page: +ctx.query.page || 1,
      sort: {sid: -1},
      // '-_id' 结果不包含 _id
      // http://stackoverflow.com/questions/9598505/mongoose-retrieving-data-without-id-field
      select: '-_id sid uid pid judge time memory language length create sim sim_s_id'
    })

  ctx.body = {
    solutions: res.docs,
    pagination: extractPagination(res)
  }
}

/**
  返回一个具体的solution
*/
async function queryOneSolution (ctx, next) {
  const sid = +ctx.params.sid

  if (isNaN(sid)) {
    ctx.throw(400, 'Sid should be a number')
  }

  const solution = await Solution
    .findOne({sid})
    // 比上面函数里的 select 多了一个 code
    .select('-_id sid uid pid judge time memory language length create sim sim_s_id code')
    .exec()

  if (!solution) {
    ctx.throw(400, 'No such a solution')
  }

  ctx.body = {
    solution
  }
}

module.exports = {
  queryList,
  queryOneSolution
}
