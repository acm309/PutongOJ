import type { Enveloped } from '@putong-oj/shared'
import type { Context } from 'koa'
import type { ZodError } from 'zod'
import { Buffer } from 'node:buffer'
import { BlockList, isIPv6 } from 'node:net'
import { md5, sha1 } from '@noble/hashes/legacy.js'
import { ErrorCode, passwordRegex } from '@putong-oj/shared'

export function passwordHashBuffer (password: string): Buffer {
  const passwordArr = Uint8Array.from(Buffer.from(password))

  const md5Hash = md5(passwordArr)
  const sha1Hash = sha1(passwordArr)

  const combined = new Uint8Array(md5Hash.length + sha1Hash.length)
  combined.set(md5Hash)
  combined.set(sha1Hash, md5Hash.length)

  return Buffer.from(combined)
}

export function passwordHash (password: string): string {
  return Buffer.from(passwordHashBuffer(password)).toString('hex')
}

export function isComplexPwd (pwd: string): boolean {
  if (pwd.length < 8) {
    return false
  }
  return passwordRegex.test(pwd)
}

export function createEnvelopedResponse<T> (ctx: Context, data: T): void {
  const { requestId } = ctx.state
  ctx.body = {
    success: true,
    code: 200,
    message: 'OK',
    data,
    requestId,
  } as Enveloped<T>
}

function getFriendlyErrorMessage (code: ErrorCode): string {
  switch (code) {
    case ErrorCode.BadRequest:
      return 'Bad request, please check your parameters and try again'
    case ErrorCode.Unauthorized:
      return 'Unauthenticated, please login first'
    case ErrorCode.Forbidden:
      return 'Permission denied, you do not have the required privileges'
    case ErrorCode.NotFound:
      return 'Entity not found, please check the parameters'
    case ErrorCode.Teapot:
      return 'I\'m a Teapot'
    case ErrorCode.NotImplemented:
      return 'This feature is not implemented yet'
    case ErrorCode.InternalServerError:
    default:
      return 'Unknown error occurred, sit back and relax, it is not your fault'
  }
}

export function createErrorResponse (
  ctx: Context,
  code: ErrorCode = ErrorCode.BadRequest,
  msg?: string,
): void {
  const { requestId } = ctx.state
  const message = msg ?? getFriendlyErrorMessage(code)
  ctx.body = {
    success: false,
    code,
    message,
    data: null,
    requestId,
  } as Enveloped<null>
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
  createErrorResponse(ctx, ErrorCode.BadRequest, message)
}

/**
 * Checks whether the given IP address is covered by any CIDR entry in the whitelist.
 */
export function isIpInWhitelist (ip: string, whitelist: { cidr: string }[]): boolean {
  if (whitelist.length === 0) {
    return false
  }

  const blockList = new BlockList()
  for (const entry of whitelist) {
    const slash = entry.cidr.lastIndexOf('/')
    const addr = slash >= 0 ? entry.cidr.slice(0, slash) : entry.cidr
    const prefix = slash >= 0 ? Number(entry.cidr.slice(slash + 1)) : (isIPv6(addr) ? 128 : 32)
    const type = isIPv6(addr) ? 'ipv6' : 'ipv4'
    try {
      blockList.addSubnet(addr, prefix, type)
    } catch {
      // skip malformed CIDR entries
    }
  }

  const type = isIPv6(ip) ? 'ipv6' : 'ipv4'
  return blockList.check(ip, type)
}

export default {
  passwordHashBuffer,
  passwordHash,
  isComplexPwd,
  createEnvelopedResponse,
  createErrorResponse,
  createZodErrorResponse,
  isIpInWhitelist,
}
