import Router from '@koa/router'
import oauthController from '../controllers/oauth'
import authnMiddleware from '../middlewares/authn'

const oauthRouter = new Router({
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
