import { randomBytes } from 'node:crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import config from '../config'
import redis from '../config/redis'

const luaScript = readFileSync(path.join(__dirname, '..', 'scripts', 'session.lua'))

interface SessionInfo {
  loginAt: string
  loginIp: string
  userAgent: string
}

export async function createSession (userId: string, ip: string, userAgent: string) {
  const sessionId = randomBytes(16).toString('hex')
  if (userAgent.length > 500) {
    userAgent = userAgent.slice(0, 500)
  }

  const now = new Date()
  const info: SessionInfo = {
    loginAt: now.toISOString(),
    loginIp: ip,
    userAgent,
  }

  await redis.eval(
    luaScript, 0,
    'create', userId, sessionId,
    JSON.stringify(info),
    String(now.getTime()),
    String(config.sessionMaxCount),
  )
  return sessionId
}

export async function accessSession (userId: string, sessionId: string) {
  const now = new Date()
  const result = await redis.eval(
    luaScript, 0,
    'access', userId, sessionId,
    String(now.getTime()),
  )

  if (!result) {
    return null
  }
  try {
    return JSON.parse(result as string) as SessionInfo
  } catch {
    return null
  }
}

export async function revokeSession (userId: string, sessionId: string) {
  await redis.eval(
    luaScript, 0,
    'revoke', userId, sessionId,
  )
}

export async function revokeOtherSessions (userId: string, keepSessionId: string) {
  return await redis.eval(
    luaScript, 0,
    'revoke_others', userId, keepSessionId,
  ) as number
}

export async function listSessions (userId: string) {
  const result = await redis.eval(
    luaScript, 0,
    'list', userId,
  ) as string[]

  const sessions = []
  for (let i = 0; i < result.length; i += 3) {
    try {
      sessions.push({
        sessionId: result[i],
        lastAccessAt: new Date(Number(result[i + 1])).toISOString(),
        info: JSON.parse(result[i + 2]),
      })
    } catch {
      // If parsing fails, skip this session
    }
  }
  return sessions
}

const sessionService = {
  createSession,
  accessSession,
  revokeSession,
  revokeOtherSessions,
  listSessions,
} as const

export default sessionService
