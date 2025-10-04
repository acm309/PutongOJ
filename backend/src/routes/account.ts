import Router from '@koa/router'
import accountController from '../controllers/account'
import authnMiddleware from '../middlewares/authn'

const accountRouter = new Router({
  prefix: '/account',
})

accountRouter.get('/profile',
  accountController.getProfile,
)
accountRouter.post('/login',
  accountController.userLogin,
)
accountRouter.post('/register',
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

export default accountRouter
