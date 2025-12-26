import type { OAuthConnection, OAuthUserProfile } from '@putongoj/shared'
import type { Types } from 'mongoose'
import type { OAuthDocument, OAuthDocumentPopulated } from '../models/OAuth'
import type { UserDocument } from '../models/User'
import { Buffer } from 'node:buffer'
import crypto from 'node:crypto'
import { OAuthAction, OAuthProvider } from '@putongoj/shared'
import superagent from 'superagent'
import { globalConfig } from '../config'
import redis from '../config/redis'
import OAuth from '../models/OAuth'

const DEFAULT_TIMEOUT = 5000
const DEFAULT_STATE_TTL = 600

export const toUserView = OAuth.toUserView

export interface OAuthClientConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  authserverURL: string
  stateTTL?: number
  timeout?: number
}

export interface OAuthState {
  provider: string
  action: OAuthAction
  [key: string]: any
  createdAt: number
}

interface OAuthTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token?: string
  scope?: string
  [key: string]: any
}

abstract class OAuthClient {
  protected config: OAuthClientConfig
  protected providerName: OAuthProvider

  constructor (providerName: OAuthProvider, config: OAuthClientConfig) {
    this.providerName = providerName
    this.config = config
  }

  abstract generateAuthUrl (state: string, scope?: string[]): string

  abstract exchangeCodeForToken (code: string): Promise<OAuthTokenResponse>

  abstract fetchUserProfile (tokenResponse: OAuthTokenResponse): Promise<OAuthUserProfile>

  async refreshToken (_refreshToken: string): Promise<OAuthTokenResponse> {
    throw new Error('Refresh token flow not implemented for this provider')
  }

  async generateState (
    action: OAuthAction = OAuthAction.LOGIN,
    metadata?: Omit<OAuthState, 'provider' | 'createdAt'>,
  ): Promise<string> {
    const state = crypto.randomBytes(16).toString('hex')
    const stateData: OAuthState = {
      ...metadata,
      action,
      provider: this.providerName,
      createdAt: Date.now(),
    }

    const key = `oauth:state:${state}`
    const ttl = this.config.stateTTL || DEFAULT_STATE_TTL
    await redis.setex(key, ttl, JSON.stringify(stateData))

    return state
  }

  async validateState (state: string): Promise<OAuthState> {
    const key = `oauth:state:${state}`
    const stateData = await redis.get(key)

    if (!stateData) {
      throw new Error('Invalid state parameter')
    }

    const parsedState = JSON.parse(stateData) as OAuthState
    if (parsedState.provider !== this.providerName) {
      throw new Error('State parameter does not match the provider')
    }

    await redis.del(key)
    return parsedState
  }
}

interface CjluOAuthProfileResponse {
  id: string
  attributes: {
    memberOf: string
    cn: string
    [key: string]: any
  }
}

class CjluOAuthClient extends OAuthClient {
  constructor (config: OAuthClientConfig) {
    super(OAuthProvider.CJLU, config)
  }

  generateAuthUrl (
    state: string,
    scopes: string[] = [ 'user_profile' ],
  ): string {
    const url = new URL(`${this.config.authserverURL}/oauth2.0/authorize`)

    url.searchParams.append('response_type', 'code')
    url.searchParams.append('redirect_uri', this.config.redirectUri)
    url.searchParams.append('client_id', this.config.clientId)
    url.searchParams.append('state', state)

    for (const scope of scopes) {
      url.searchParams.append('scope', scope)
    }

    return url.toString()
  }

  async exchangeCodeForToken (code: string): Promise<OAuthTokenResponse> {
    try {
      const response = await superagent
        .post(`${this.config.authserverURL}/oauth2.0/accessToken`)
        .set('User-Agent', 'Putong-OJ-OAuth')
        .timeout(this.config.timeout || DEFAULT_TIMEOUT)
        .type('form')
        .send({
          grant_type: 'authorization_code',
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          redirect_uri: this.config.redirectUri,
          code,
        })

      return response.body as OAuthTokenResponse
    } catch (error: any) {
      if (error.response?.body?.error === 'authorize_code_is_invalid') {
        throw new Error('Invalid authorization code')
      }
      throw new Error('Failed to exchange code for token')
    }
  }

  async fetchUserProfile (tokenResponse: OAuthTokenResponse): Promise<OAuthUserProfile> {
    try {
      const response = await superagent
        .post(`${this.config.authserverURL}/oauthApi/user/profile`)
        .set('User-Agent', 'Putong-OJ-OAuth')
        .timeout(this.config.timeout || DEFAULT_TIMEOUT)
        .type('form')
        .send({ access_token: tokenResponse.accessToken })

      const profileResponse = response.body as CjluOAuthProfileResponse

      return {
        provider: this.providerName,
        providerId: profileResponse.id,
        displayName: profileResponse.attributes.cn,
        raw: profileResponse,
      }
    } catch (error: any) {
      throw new Error(`Failed to fetch user profile: ${error.message}`)
    }
  }
}

interface CodeforcesOAuthProfileResponse {
  sub: string
  aud: string
  iss: string
  handle: string
  avatar: string
  rating: number
  [key: string]: any
}

class CodeforcesOAuthClient extends OAuthClient {
  constructor (config: OAuthClientConfig) {
    super(OAuthProvider.Codeforces, config)
  }

  generateAuthUrl (
    state: string,
    scopes: string[] = [ 'openid' ],
  ): string {
    const url = new URL(`${this.config.authserverURL}/oauth/authorize`)

    url.searchParams.append('response_type', 'code')
    url.searchParams.append('redirect_uri', this.config.redirectUri)
    url.searchParams.append('client_id', this.config.clientId)
    url.searchParams.append('state', state)

    for (const scope of scopes) {
      url.searchParams.append('scope', scope)
    }

    return url.toString()
  }

  async exchangeCodeForToken (code: string): Promise<OAuthTokenResponse> {
    try {
      const response = await superagent
        .post(`${this.config.authserverURL}/oauth/token`)
        .set('User-Agent', 'Putong-OJ-OAuth')
        .timeout(this.config.timeout || DEFAULT_TIMEOUT)
        .type('form')
        .send({
          grant_type: 'authorization_code',
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          redirect_uri: this.config.redirectUri,
          code,
        })

      return response.body as OAuthTokenResponse
    } catch (error: any) {
      throw new Error(`Failed to exchange code for token: ${error.message}`)
    }
  }

  async fetchUserProfile (tokenResponse: OAuthTokenResponse): Promise<OAuthUserProfile> {
    try {
      const idToken = tokenResponse.id_token as string
      const payloadBase64 = idToken.split('.')[1]
      const payloadJson = Buffer.from(payloadBase64, 'base64').toString('utf-8')
      const profileResponse = JSON.parse(payloadJson) as CodeforcesOAuthProfileResponse

      return {
        provider: this.providerName,
        providerId: profileResponse.sub,
        displayName: profileResponse.handle,
        raw: profileResponse,
      }
    } catch (error: any) {
      throw new Error(`Failed to fetch user profile: ${error.message}`)
    }
  }
}

const oauthClients = Object.values(OAuthProvider).reduce((acc, provider) => {
  acc[provider] = null
  return acc
}, {} as Record<OAuthProvider, OAuthClient | null>)

function getOAuthClient (provider: OAuthProvider): OAuthClient {
  if (!globalConfig.oauthConfigs[provider]?.enabled) {
    throw new Error(`OAuth provider ${provider} is not enabled`)
  }

  if (!oauthClients[provider]) {
    const config = globalConfig.oauthConfigs[provider]
    switch (provider) {
      case OAuthProvider.CJLU:
        oauthClients[provider] = new CjluOAuthClient(config)
        break
      case OAuthProvider.Codeforces:
        oauthClients[provider] = new CodeforcesOAuthClient(config)
        break
      default:
        throw new Error(`OAuth provider ${provider} is not supported`)
    }
  }

  return oauthClients[provider]!
}

export async function generateOAuthUrl (
  provider: OAuthProvider,
  action: OAuthAction,
): Promise<string> {
  const client = getOAuthClient(provider)
  const state = await client.generateState(action)
  return client.generateAuthUrl(state)
}

export async function handleOAuthCallback (
  provider: OAuthProvider,
  state: string,
  code: string,
): Promise<{ stateData: OAuthState, connection: OAuthConnection }> {
  const client = getOAuthClient(provider)
  const stateData = await client.validateState(state)
  const tokenResponse = await client.exchangeCodeForToken(code)
  const userProfile = await client.fetchUserProfile(tokenResponse)

  return {
    stateData,
    connection: {
      ...userProfile,
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
    },
  }
}

export async function findUserByOAuthConnection (
  provider: OAuthProvider,
  providerId: string,
): Promise<UserDocument | null> {
  const oauthRecord = await OAuth
    .findOne({ provider, providerId })
    .populate('user') as OAuthDocumentPopulated | null

  return oauthRecord?.user as UserDocument ?? null
}

export async function getUserOAuthConnections (
  userId: Types.ObjectId,
): Promise<Record<OAuthProvider, OAuthDocument | null>> {
  const records = await OAuth.find({ user: userId }) as OAuthDocument[]
  const connections: Record<OAuthProvider, OAuthDocument | null> = {
    [OAuthProvider.CJLU]: null,
    [OAuthProvider.Codeforces]: null,
  }

  for (const record of records) {
    connections[record.provider as OAuthProvider] = record
  }
  return connections
}

export async function isOAuthConnectedToAnotherUser (
  userId: Types.ObjectId,
  connectionData: OAuthConnection,
): Promise<boolean> {
  const { provider, providerId } = connectionData
  const count = await OAuth.countDocuments({
    provider, providerId, user: { $ne: userId },
  })
  return count > 0
}

export async function upsertOAuthConnection (
  userId: Types.ObjectId,
  connectionData: OAuthConnection,
): Promise<OAuthDocument> {
  const { provider, providerId, displayName, accessToken, refreshToken, raw } = connectionData

  let oauthRecord = await OAuth.findOne({ provider, providerId })

  if (oauthRecord) {
    oauthRecord.displayName = displayName
    oauthRecord.accessToken = accessToken
    oauthRecord.refreshToken = refreshToken
    oauthRecord.raw = raw
  } else {
    oauthRecord = new OAuth({
      user: userId,
      provider,
      providerId,
      displayName,
      accessToken,
      refreshToken,
      raw,
    })
  }

  await oauthRecord.save()
  return oauthRecord
}

export async function removeOAuthConnection (
  userId: Types.ObjectId,
  provider: OAuthProvider,
): Promise<boolean> {
  const result = await OAuth.deleteOne({ user: userId, provider })
  return result.deletedCount > 0
}

const oauthService = {
  toUserView,
  generateOAuthUrl,
  handleOAuthCallback,
  findUserByOAuthConnection,
  getUserOAuthConnections,
  isOAuthConnectedToAnotherUser,
  upsertOAuthConnection,
  removeOAuthConnection,
} as const

export default oauthService
