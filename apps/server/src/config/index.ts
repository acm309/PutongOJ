import type { OAuthClientConfig } from '../services/oauth.ts'
import { randomBytes } from 'node:crypto'
import { resolve } from 'node:path'
import { env } from 'node:process'
import { OAuthProvider } from '@putong-oj/shared'
import dotenvFlow from 'dotenv-flow'

const workspaceRoot = resolve(import.meta.dirname, '../../../..')
dotenvFlow.config({ path: workspaceRoot, silent: true })

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
  mongodbURL: string
  redisURL: string
  secretKey: string
  sessionMaxAge: number
  sessionMaxCount: number
  reverseProxy: {
    trust: boolean
    ipHeader: string
  }
  disableRateLimit: boolean
  mongooseDebug: boolean
  oauthConfigs: Record<OAuthProvider, { enabled: boolean } & OAuthClientConfig>
  submissionHeatmapTimezone: string
  umamiAnalytics: {
    websiteId?: string
    scriptURL?: string
  }
}

const oauthConfigs: GlobalConfig['oauthConfigs'] = {
  [OAuthProvider.CJLU]: {
    enabled: booleanEnv('PTOJ_OAUTH_CJLU_ENABLED', false),
    clientId: stringEnv('PTOJ_OAUTH_CJLU_CLIENT_ID', ''),
    clientSecret: stringEnv('PTOJ_OAUTH_CJLU_CLIENT_SECRET', ''),
    redirectUri: stringEnv('PTOJ_OAUTH_CJLU_REDIRECT_URI', ''),
    authserverURL: stringEnv('PTOJ_OAUTH_CJLU_AUTHSERVER_URL', ''),
    stateTTL: numberEnv('PTOJ_OAUTH_CJLU_STATE_TTL'),
    timeout: numberEnv('PTOJ_OAUTH_CJLU_TIMEOUT'),
  },
  [OAuthProvider.Codeforces]: {
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
  sessionMaxCount: numberEnv(
    'PTOJ_SESSION_MAX_COUNT',
    10,
  ),
  reverseProxy: {
    trust: booleanEnv(
      'PTOJ_TRUST_PROXY',
      false,
    ),
    ipHeader: stringEnv(
      'PTOJ_PROXY_IP_HEADER',
      'X-Forwarded-For',
    ),
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
  submissionHeatmapTimezone: stringEnv('PTOJ_SUBMISSION_HEATMAP_TIMEZONE', 'Asia/Shanghai'),
  umamiAnalytics: {
    websiteId: stringEnv('PTOJ_UMAMI_WEBSITE_ID'),
    scriptURL: stringEnv('PTOJ_UMAMI_SCRIPT_URL'),
  },
}

export default globalConfig
