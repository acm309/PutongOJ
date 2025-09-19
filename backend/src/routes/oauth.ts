import type { DefaultContext, DefaultState } from 'koa'
import Router from '@koa/router'
import oauthController from '../controllers/oauth'
import authnMiddleware from '../middlewares/authn'

const oauthRouter = new Router<DefaultState, DefaultContext>({
  prefix: '/oauth',
})

oauthRouter.get('/',
  authnMiddleware.loginRequire,
  oauthController.getUserOAuthConnections,
)
oauthRouter.get('/:provider/url',
  oauthController.generateOAuthUrl,
)
oauthRouter.get('/:provider/callback',
  oauthController.handleOAuthCallback,
)

export default oauthRouter
