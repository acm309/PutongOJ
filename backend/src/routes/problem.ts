import Router from '@koa/router'
import problemController from '../controllers/problem'
import authnMiddleware from '../middlewares/authn'

const problemRouter = new Router({
  prefix: '/problem',
})

problemRouter.get('/',
  problemController.findProblems,
)
problemRouter.get('/items',
  authnMiddleware.loginRequire,
  problemController.findProblemItems,
)
problemRouter.post('/',
  authnMiddleware.loginRequire,
  problemController.createProblem,
)

problemRouter.get('/:pid',
  problemController.getProblem,
)
problemRouter.put('/:pid',
  authnMiddleware.loginRequire,
  problemController.updateProblem,
)
problemRouter.del('/:pid',
  authnMiddleware.rootRequire,
  problemController.removeProblem,
)

problemRouter.get('/:pid/statistics',
  authnMiddleware.loginRequire,
  problemController.getStatistics,
)
problemRouter.get('/:pid/solutions',
  authnMiddleware.loginRequire,
  problemController.findSolutions,
)

export default problemRouter
