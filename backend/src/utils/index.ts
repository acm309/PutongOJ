import type { PaginateOption } from '../types'
import crypto from 'node:crypto'
import { pick } from 'lodash'

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

export function generatePwd (pwd: string): string {
  return crypto.createHash('md5').update(pwd).digest('hex')
    + crypto.createHash('sha1').update(pwd).digest('hex')
}

export function isComplexPwd (pwd: string): boolean {
  if (pwd.length < 8) {
    return false
  }
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(pwd)
}

export function only<T extends object> (
  obj: T,
  keys: string | string[],
): Partial<T> {
  if (typeof keys === 'string') {
    keys = keys.split(' ')
  }
  return pick(obj, keys)
}

export default module.exports = {
  parsePaginateOption,
  generatePwd,
  isComplexPwd,
  only,
}
