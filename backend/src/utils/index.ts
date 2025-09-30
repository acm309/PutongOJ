import type { Enveloped } from '@putongoj/shared'
import type { Context } from 'koa'
import type { ZodError } from 'zod'
import type { PaginateOption } from '../types'
import { Buffer } from 'node:buffer'
import { md5, sha1 } from '@noble/hashes/legacy.js'
import { sha256 } from '@noble/hashes/sha2.js'
import { pick, pickBy } from 'lodash'
import { ErrorCode } from './error'

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

export function passwordHash (password: string): string {
  const passwordArr = Uint8Array.from(Buffer.from(password))

  const md5Hash = md5(passwordArr)
  const sha1Hash = sha1(passwordArr)

  const combined = new Uint8Array(md5Hash.length + sha1Hash.length)
  combined.set(md5Hash)
  combined.set(sha1Hash, md5Hash.length)

  return Buffer.from(combined).toString('hex')
}

export function passwordChecksum (passwordHash: string): string {
  const hashArr = Uint8Array.from(Buffer.from(passwordHash, 'hex'))
  const sha256Hash = sha256(hashArr)
  return Buffer.from(sha256Hash.slice(0, 12)).toString('base64')
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

export function purify (obj: Record<string, any>) {
  return pickBy(obj, x => x != null && x !== '')
}

export function createEnvelopedResponse<T> (ctx: Context, data: T): void {
  const { requestId } = ctx.state
  ctx.body = <Enveloped<T>>{
    success: true,
    code: ErrorCode.OK,
    message: 'OK',
    data,
    requestId,
  }
}

export function createErrorResponse (
  ctx: Context,
  message: string,
  code: ErrorCode = ErrorCode.BadRequest,
): void {
  const { requestId } = ctx.state
  ctx.body = <Enveloped<null>>{
    success: false,
    code,
    message,
    data: null,
    requestId,
  }
}

function getFriendlyZodErrorMessage (error: ZodError): string {
  if (error.issues.length === 0) {
    return 'Unknown validation error occurred'
  }

  const firstIssue = error.issues[0]
  const message = firstIssue.message
  const path = firstIssue.path.length > 0 ? ` at ${firstIssue.path.join('.')}` : ''

  return message + path
}

export function createZodErrorResponse (
  ctx: Context,
  error: ZodError,
): void {
  const message = getFriendlyZodErrorMessage(error)
  createErrorResponse(ctx, message, ErrorCode.BadRequest)
}

export default {
  parsePaginateOption,
  passwordHash,
  isComplexPwd,
  only,
  purify,
  createEnvelopedResponse,
  createErrorResponse,
  createZodErrorResponse,
}
