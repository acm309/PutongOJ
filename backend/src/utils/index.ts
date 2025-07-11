import type { PaginateOption } from '../types'

export function parsePaginateOption (
  opt: Record<string, unknown>,
  defaultPageSize = 10,
  maxPageSize = 100,
): PaginateOption {
  let page = Number(opt.page)
  let pageSize = Number(opt.pageSize)

  if (!Number.isInteger(page) || page <= 0) {
    page = 1
  }

  if (!Number.isInteger(pageSize) || pageSize <= 0) {
    pageSize = defaultPageSize
  } else if (pageSize > maxPageSize) {
    pageSize = maxPageSize
  }

  return { page, pageSize }
}
