import Router from '@koa/router'
import utilsController from '../controllers/utils'
import authnMiddleware from '../middlewares/authn'

const utilsRouter = new Router()

utilsRouter.post('/upload',
  authnMiddleware.adminRequire,
  utilsController.upload,
)
utilsRouter.get('/servertime',
  utilsController.serverTime,
)
utilsRouter.get('/website',
  utilsController.websiteInformation,
)

export default utilsRouter
