const process = require('node:process')

module.exports = {
  title: process.env.title || 'Putong OJ',
  discussOnProblem: (process.env.discussOnProblem || 'false').toLocaleLowerCase() === 'true',
  semi_restful: (process.env.semiRestful || 'false').toLocaleLowerCase() === 'true',
}

/**
 * semi_restful:
 * 取消所有的 PUT 和 DELETE 请求，全部变成 POST 请求
 * e.g.:
 * PUT /example => POST /example/update
 * DELETE /example => POST /example/delete
 */
