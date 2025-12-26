import type { OAuthProvider } from '@putongoj/shared'
import type { OAuthClientConfig } from '../services/oauth'
import { randomBytes } from 'node:crypto'
import { env } from 'node:process'
import dotenvFlow from 'dotenv-flow'
import constants from '../utils/constants'

dotenvFlow.config()

function stringEnv (name: string): string | undefined
function stringEnv (name: string, defaultValue: string | (() => string)): string
function stringEnv (name: string, defaultValue?: string | (() => string)): string | undefined {
  const value = env[name]?.trim()
  if (value === undefined || value === '') {
    return typeof defaultValue === 'function' ? defaultValue() : defaultValue
  }
  return value
}

function numberEnv (name: string): number | undefined
function numberEnv (name: string, defaultValue: number): number
function numberEnv (name: string, defaultValue?: number): number | undefined {
  const value = env[name]?.trim()
  if (value === undefined || value === '') {
    return defaultValue
  }
  const parsed = Number.parseInt(value, 10)
  if (Number.isNaN(parsed)) {
    return defaultValue
  }
  return parsed
}

function booleanEnv (name: string): boolean | undefined
function booleanEnv (name: string, defaultValue: boolean): boolean
function booleanEnv (name: string, defaultValue?: boolean): boolean | undefined {
  const value = env[name]?.trim()
  if (value === undefined || value === '') {
    return defaultValue
  }
  if (value.toLowerCase() === 'true') {
    return true
  }
  if (value.toLowerCase() === 'false') {
    return false
  }
  return defaultValue
}

interface GlobalConfig {
  port: number
  wsPort: number
  mongodbURL: string
  redisURL: string
  secretKey: string
  sessionMaxAge: number
  reverseProxy: {
    enabled: boolean
    forwardLimit: number
    forwardedForHeader: string
    trustedProxies: string[]
  }
  disableRateLimit: boolean
  mongooseDebug: boolean
  oauthConfigs: Record<OAuthProvider, { enabled: boolean } & OAuthClientConfig>
}

const oauthConfigs: GlobalConfig['oauthConfigs'] = {
  CJLU: {
    enabled: booleanEnv('PTOJ_OAUTH_CJLU_ENABLED', false),
    clientId: stringEnv('PTOJ_OAUTH_CJLU_CLIENT_ID', ''),
    clientSecret: stringEnv('PTOJ_OAUTH_CJLU_CLIENT_SECRET', ''),
    redirectUri: stringEnv('PTOJ_OAUTH_CJLU_REDIRECT_URI', ''),
    authserverURL: stringEnv('PTOJ_OAUTH_CJLU_AUTHSERVER_URL', ''),
    stateTTL: numberEnv('PTOJ_OAUTH_CJLU_STATE_TTL'),
    timeout: numberEnv('PTOJ_OAUTH_CJLU_TIMEOUT'),
  },
  Codeforces: {
    enabled: booleanEnv('PTOJ_OAUTH_CODEFORCES_ENABLED', false),
    clientId: stringEnv('PTOJ_OAUTH_CODEFORCES_CLIENT_ID', ''),
    clientSecret: stringEnv('PTOJ_OAUTH_CODEFORCES_CLIENT_SECRET', ''),
    redirectUri: stringEnv('PTOJ_OAUTH_CODEFORCES_REDIRECT_URI', ''),
    authserverURL: stringEnv('PTOJ_OAUTH_CODEFORCES_AUTHSERVER_URL', 'https://codeforces.com'),
    stateTTL: numberEnv('PTOJ_OAUTH_CODEFORCES_STATE_TTL'),
    timeout: numberEnv('PTOJ_OAUTH_CODEFORCES_TIMEOUT'),
  },
}

for (const [ provider, config ] of Object.entries(oauthConfigs)) {
  if (config.enabled) {
    if (!config.clientId || !config.clientSecret || !config.redirectUri || !config.authserverURL) {
      throw new Error(`OAuth provider ${provider} is enabled but not configured properly.`)
    }
  }
}

export const globalConfig: GlobalConfig = {
  port: numberEnv('PTOJ_WEB_PORT', 3000),
  wsPort: numberEnv('PTOJ_WS_PORT', 3001),
  mongodbURL: stringEnv(
    'PTOJ_MONGODB_URL',
    'mongodb://localhost:27017/oj',
  ),
  redisURL: stringEnv(
    'PTOJ_REDIS_URL',
    'redis://localhost:6379',
  ),
  secretKey: stringEnv(
    'PTOJ_SECRET_KEY',
    () => randomBytes(16).toString('hex'),
  ),
  sessionMaxAge: numberEnv(
    'PTOJ_SESSION_MAX_AGE',
    7 * 24 * 60 * 60,
  ),
  reverseProxy: {
    enabled: booleanEnv(
      'PTOJ_REVERSE_PROXY_ENABLED',
      false,
    ),
    forwardLimit: numberEnv(
      'PTOJ_REVERSE_PROXY_FORWARD_LIMIT',
      1,
    ),
    forwardedForHeader: stringEnv(
      'PTOJ_REVERSE_PROXY_FORWARDED_FOR_HEADER',
      'X-Forwarded-For',
    ),
    trustedProxies: stringEnv(
      'PTOJ_REVERSE_PROXY_TRUSTED_PROXIES',
      '',
    ).split(',').map(s => s.trim()).filter(s => s.length > 0),
  },
  disableRateLimit: booleanEnv(
    'PTOJ_DISABLE_RATE_LIMIT',
    false,
  ),
  mongooseDebug: booleanEnv(
    'PTOJ_MONGOOSE_DEBUG',
    false,
  ),
  oauthConfigs,
}

const config = {
  globalConfig,
  ...globalConfig,
  /** @deprecated */
  ...constants,
} as const

export default config
