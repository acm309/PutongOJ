import type { Context } from 'koa'
import type { OAuthEntityUserView } from '../models/OAuth'
import type { UserDocument } from '../models/User'
import type { OAuthConnection, OAuthState } from '../services/oauth'
import { loadProfile } from '../middlewares/authn'
import oauthService, { OAuthAction, OAuthProvider } from '../services/oauth'
import sessionService from '../services/session'
import { ERR_BAD_PARAMS, ERR_NOT_FOUND } from '../utils/error'
import logger from '../utils/logger'

const providerMap: Record<string, OAuthProvider> = {
  cjlu: OAuthProvider.CJLU,
}

function parseProvider (ctx: Context): OAuthProvider {
  const provider = ctx.params.provider || ctx.request.query.provider
  if (!provider || typeof provider !== 'string') {
    ctx.throw(...ERR_BAD_PARAMS)
  }
  if (!Object.keys(providerMap).includes(provider)) {
    ctx.throw(...ERR_NOT_FOUND)
  }

  return providerMap[provider]
}

export async function generateOAuthUrl (ctx: Context) {
  const provider = parseProvider(ctx)
  const { action } = ctx.request.query
  if (
    typeof action !== 'string'
    || !Object.values(OAuthAction).includes(action as OAuthAction)
  ) {
    ctx.throw(...ERR_BAD_PARAMS)
  }

  try {
    const url = await oauthService
      .generateOAuthUrl(provider, action as OAuthAction)
    ctx.body = { url }
  } catch (error: any) {
    ctx.throw(400, error.message)
  }
}

export async function handleOAuthCallback (ctx: Context) {
  const provider = parseProvider(ctx)
  const { state, code } = ctx.request.query
  if (typeof state !== 'string' || typeof code !== 'string') {
    ctx.throw(...ERR_BAD_PARAMS)
  }

  let stateData: OAuthState | null = null
  let connection: OAuthConnection | null = null
  try {
    const result = await oauthService.handleOAuthCallback(provider, state, code)
    stateData = result.stateData
    connection = result.connection
  } catch (error: any) {
    ctx.throw(400, error.message)
  }

  let user: UserDocument | null = null
  if (stateData.action === OAuthAction.CONNECT) {
    const profile = await loadProfile(ctx)
    const isConnected = await oauthService
      .isOAuthConnectedToAnotherUser(profile._id, connection)
    if (isConnected) {
      ctx.throw(400, 'This 3rd-party account has been connected to another user')
    }
    user = profile
  } else if (stateData.action === OAuthAction.LOGIN) {
    const { requestId = 'unknown' } = ctx.state
    const { provider, providerId } = connection
    const connectedUser = await oauthService
      .findUserByOAuthConnection(provider, providerId)
    if (!connectedUser) {
      ctx.throw(400, 'No user is connected with this 3rd-party account')
    }
    user = connectedUser
    logger.info(`User <${user.uid}> login via ${provider} OAuth successfully [${requestId}]`)
    sessionService.setUserSession(ctx, user)
  } else {
    ctx.throw(400, 'Unknown OAuth action')
  }
  const updatedConnection = await oauthService
    .upsertOAuthConnection(user._id, connection)
  const response: Pick<OAuthState, 'action'> & {
    connection: OAuthEntityUserView
  } = {
    action: stateData.action,
    connection: oauthService.toUserView(updatedConnection),
  }
  ctx.body = response
}

export async function getUserOAuthConnections (ctx: Context) {
  const profile = await loadProfile(ctx)
  const connections = await oauthService
    .getUserOAuthConnections(profile._id)
  const connectionsUserView: Record<OAuthProvider, OAuthEntityUserView | null> = {
    [OAuthProvider.CJLU]: null,
  }
  Object.keys(connections).forEach((key) => {
    if (connections[key as OAuthProvider]) {
      connectionsUserView[key as OAuthProvider] = oauthService
        .toUserView(connections[key as OAuthProvider]!)
    }
  })
  ctx.body = connectionsUserView
}

const oauthController = {
  generateOAuthUrl,
  handleOAuthCallback,
  getUserOAuthConnections,
}

export default oauthController
