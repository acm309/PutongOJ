import Router from '@koa/router'
import adminController from '../controllers/admin'
import authnMiddleware from '../middlewares/authn'
import ratelimitMiddleware from '../middlewares/ratelimit'

const adminRouter = new Router({
  prefix: '/admin',
})

adminRouter.use(authnMiddleware.adminRequire)

adminRouter.get('/users',
  adminController.findUsers,
)
adminRouter.get('/users/:uid',
  adminController.getUser,
)
adminRouter.put('/users/:uid',
  adminController.updateUser,
)
adminRouter.put('/users/:uid/password',
  adminController.updateUserPassword,
)
adminRouter.get('/users/:uid/oauth',
  adminController.getUserOAuthConnections,
)
adminRouter.delete('/users/:uid/oauth/:provider',
  adminController.removeUserOAuthConnection,
)

adminRouter.get('/solutions',
  adminController.findSolutions,
)
adminRouter.get('/solutions/export',
  ratelimitMiddleware.dataExportLimit,
  adminController.exportSolutions,
)

adminRouter.post('/notifications/broadcast',
  adminController.sendNotificationBroadcast,
)

adminRouter.get('/groups/:groupId',
  adminController.getGroup,
)
adminRouter.post('/groups',
  adminController.createGroup,
)
adminRouter.put('/groups/:groupId',
  adminController.updateGroup,
)
adminRouter.put('/groups/:groupId/members',
  adminController.updateGroupMembers,
)
adminRouter.delete('/groups/:groupId',
  authnMiddleware.rootRequire,
  adminController.removeGroup,
)

export default adminRouter
