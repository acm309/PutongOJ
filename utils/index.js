function extractPagination (pagination) {
  return {
    limit: pagination.limit,
    page: +pagination.page,
    pages: pagination.pages,
    total: pagination.total
  }
}

module.exports = {
  extractPagination
}
