const crypto = require('crypto')

function extractPagination (pagination) {
  return {
    limit: pagination.limit,
    page: +pagination.page,
    pages: pagination.pages,
    total: pagination.total
  }
}

/**
  用 md5 + sha1 生成密码；
  之所以采用这种方法加密，只是因为历史遗留问题 -- 上一个 oj 是这么做的
*/
function generatePwd (pwd) {
  return crypto.createHash('md5').update(pwd).digest('hex') +
    crypto.createHash('sha1').update(pwd).digest('hex')
}

function isUndefined (item) {
  return typeof item === 'undefined'
}

module.exports = {
  extractPagination,
  generatePwd,
  isUndefined
}
