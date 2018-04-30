module.exports = {
  title: 'Putong OJ',
  discussOnProblem: true,
  semi_restful: false
}

/**
 * semi_restful:
 * 取消所有的 PUT 和 DELETE 请求，全部变成 POST 请求
 * e.g.:
 * PUT /example => POST /example/update
 * DELETE /example => POST /example/delete
 */
