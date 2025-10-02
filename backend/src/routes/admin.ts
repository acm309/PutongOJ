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

adminRouter.patch('/user/:uid',
  authnMiddleware.adminRequire,
  adminController.updateUser,
)

export default adminRouter
