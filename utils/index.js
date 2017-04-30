const crypto = require('crypto')

function extractPagination (pagination) {
  return {
    limit: pagination.limit,
    page: +pagination.page,
    pages: pagination.pages,
    total: pagination.total
  }
}

function generatePwd (pwd) {
  return crypto.createHash('md5').update(pwd).digest('hex') +
    crypto.createHash('sha1').update(pwd).digest('hex')
}

module.exports = {
  extractPagination,
  generatePwd
}
