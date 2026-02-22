import Router from '@koa/router'
import accountController from '../controllers/account'
import sessionController from '../controllers/session'
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
  sessionController.listSessions,
)
accountRouter.delete('/sessions',
  authnMiddleware.loginRequire,
  sessionController.revokeOtherSessions,
)
accountRouter.delete('/sessions/:sessionId',
  authnMiddleware.loginRequire,
  sessionController.revokeSession,
)

export default accountRouter
