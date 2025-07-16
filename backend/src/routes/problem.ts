import type { DefaultContext, DefaultState } from 'koa'
import Router from 'koa-router'
import problemController from '../controllers/problem'
import authnMiddleware from '../middlewares/authn'

const problemRouter = new Router<DefaultState, DefaultContext>({
  prefix: '/problem',
})

problemRouter.get('/',
  problemController.findProblems,
)
problemRouter.post('/',
  authnMiddleware.adminRequire,
  problemController.createProblem,
)
problemRouter.get('/:pid',
  problemController.getProblem,
)
problemRouter.put('/:pid',
  authnMiddleware.adminRequire,
  problemController.updateProblem,
)
problemRouter.del('/:pid',
  authnMiddleware.adminRequire,
  problemController.removeProblem,
)

export default module.exports = problemRouter
