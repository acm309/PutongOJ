import Router from '@koa/router'
import adminController from '../controllers/admin'
import authnMiddleware from '../middlewares/authn'

const adminRouter = new Router({
  prefix: '/admin',
})

adminRouter.get('/user',
  authnMiddleware.adminRequire,
  adminController.findUsers,
)
adminRouter.get('/user/:uid',
  authnMiddleware.adminRequire,
  adminController.getUser,
)
adminRouter.put('/user/:uid',
  authnMiddleware.adminRequire,
  adminController.updateUser,
)
adminRouter.put('/user/:uid/password',
  authnMiddleware.adminRequire,
  adminController.updateUserPassword,
)
adminRouter.get('/user/:uid/oauth',
  authnMiddleware.adminRequire,
  adminController.getUserOAuthConnections,
)
adminRouter.delete('/user/:uid/oauth/:provider',
  authnMiddleware.rootRequire,
  adminController.removeUserOAuthConnection,
)

export default adminRouter
