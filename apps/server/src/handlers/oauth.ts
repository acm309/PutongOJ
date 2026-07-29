import type { OAuthConnection } from '@putongoj/shared'
import type { Context } from 'koa'
import type { UserDocument } from '../models/User'
import type { OAuthState } from '../services/oauth'
import Router from '@koa/router'
import {
  ErrorCode,
  OAuthAction,
  OAuthCallbackQueryResultSchema,
  OAuthCallbackQuerySchema,
  OAuthGenerateUrlQueryResultSchema,
  OAuthGenerateUrlQuerySchema,
  OAuthProvider,
  OAuthProviderSchema,
  OAuthUserConnectionsQueryResultSchema,
} from '@putongoj/shared'
import { loadProfile, loginRequire } from '../middlewares/authn'
import oauthService from '../services/oauth'
import sessionService from '../services/session'
import { createEnvelopedResponse, createErrorResponse, createZodErrorResponse } from '../utils'

export const providerMap: Record<string, OAuthProvider> = {
  cjlu: OAuthProvider.CJLU,
  codeforces: OAuthProvider.Codeforces,
} as const

const loginEnabledProviders: OAuthProvider[] = [
  OAuthProvider.CJLU,
] as const

export async function generateOAuthUrl (ctx: Context) {
  const provider = OAuthProviderSchema.safeParse(ctx.params.provider)
  if (!provider.success) {
    return createZodErrorResponse(ctx, provider.error)
  }
  const query = OAuthGenerateUrlQuerySchema.safeParse(ctx.request.query)
  if (!query.success) {
    return createZodErrorResponse(ctx, query.error)
  }

  try {
    const url = await oauthService.generateOAuthUrl(provider.data, query.data.action)
    const response = OAuthGenerateUrlQueryResultSchema.encode({ url })
    return createEnvelopedResponse(ctx, response)
  } catch (error: any) {
    return createErrorResponse(ctx, ErrorCode.BadRequest, error.message)
  }
}

export async function handleOAuthCallback (ctx: Context) {
  const provider = OAuthProviderSchema.safeParse(ctx.params.provider)
  if (!provider.success) {
    return createZodErrorResponse(ctx, provider.error)
  }
  const query = OAuthCallbackQuerySchema.safeParse(ctx.request.query)
  if (!query.success) {
    return createZodErrorResponse(ctx, query.error)
  }

  let stateData: OAuthState | null = null
  let connection: OAuthConnection | null = null
  try {
    const result = await oauthService.handleOAuthCallback(
      provider.data, query.data.state, query.data.code)
    stateData = result.stateData
    connection = result.connection
  } catch (error: any) {
    return createErrorResponse(ctx, ErrorCode.BadRequest, error.message)
  }

  let user: UserDocument | null = null
  if (stateData.action === OAuthAction.CONNECT) {
    const profile = await loadProfile(ctx)
    const isConnected = await oauthService
      .isOAuthConnectedToAnotherUser(profile._id, connection)
    if (isConnected) {
      return createErrorResponse(ctx, ErrorCode.BadRequest, 'This 3rd-party account has been connected to another user')
    }
    user = profile
  } else if (stateData.action === OAuthAction.LOGIN) {
    const { provider, providerId } = connection
    if (!loginEnabledProviders.includes(provider)) {
      return createErrorResponse(ctx, ErrorCode.BadRequest, `Login via ${provider} OAuth is not enabled`)
    }
    const connectedUser = await oauthService
      .findUserByOAuthConnection(provider, providerId)
    if (!connectedUser) {
      return createErrorResponse(ctx, ErrorCode.BadRequest, 'No user is connected with this 3rd-party account, please login first and bind it')
    }
    user = connectedUser

    const userId = user._id.toString()
    const sessionId = await sessionService.createSession(
      userId, ctx.state.clientIp, ctx.get('User-Agent') || '',
    )
    ctx.session.userId = userId
    ctx.session.sessionId = sessionId

    ctx.auditLog.info(`<User:${user.uid}> logged in via ${provider} OAuth`)
  } else {
    return createErrorResponse(ctx, ErrorCode.BadRequest, 'Invalid OAuth action')
  }
  const updatedConnection = await oauthService
    .upsertOAuthConnection(user._id, connection)
  const response = OAuthCallbackQueryResultSchema.encode({
    action: stateData.action,
    connection: updatedConnection,
  })
  return createEnvelopedResponse(ctx, response)
}

export async function getUserOAuthConnections (ctx: Context) {
  const profile = await loadProfile(ctx)
  const connections = await oauthService.getUserOAuthConnections(profile._id)
  const result = OAuthUserConnectionsQueryResultSchema.encode(connections)
  return createEnvelopedResponse(ctx, result)
}

function registerOAuthHandlers (router: Router) {
  const oauthRouter = new Router({ prefix: '/oauth' })

  oauthRouter.get('/', loginRequire, getUserOAuthConnections)
  oauthRouter.get('/:provider/url', generateOAuthUrl)
  oauthRouter.get('/:provider/callback', handleOAuthCallback)

  router.use(oauthRouter.routes(), oauthRouter.allowedMethods())
}

export default registerOAuthHandlers
