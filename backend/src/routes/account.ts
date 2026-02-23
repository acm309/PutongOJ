import Router from '@koa/router'
import accountController from '../controllers/account'
import authnMiddleware from '../middlewares/authn'
import ratelimitMiddleware from '../middlewares/ratelimit'

const accountRouter = new Router({
  prefix: '/account',
})

accountRouter.get('/profile',
  accountController.getProfile,
)
accountRouter.post('/login',
  ratelimitMiddleware.userLoginLimit,
  accountController.userLogin,
)
accountRouter.post('/register',
  ratelimitMiddleware.userRegisterLimit,
  accountController.userRegister,
)
accountRouter.post('/logout',
  authnMiddleware.loginRequire,
  accountController.userLogout,
)
accountRouter.put('/profile',
  authnMiddleware.loginRequire,
  accountController.updateProfile,
)
accountRouter.put('/password',
  authnMiddleware.loginRequire,
  accountController.updatePassword,
)
accountRouter.get('/submissions',
  authnMiddleware.loginRequire,
  accountController.findSubmissions,
)

accountRouter.get('/sessions',
  authnMiddleware.loginRequire,
  accountController.listSessions,
)
accountRouter.delete('/sessions',
  authnMiddleware.loginRequire,
  accountController.revokeOtherSessions,
)
accountRouter.delete('/sessions/:sessionId',
  authnMiddleware.loginRequire,
  accountController.revokeSession,
)

export default accountRouter
