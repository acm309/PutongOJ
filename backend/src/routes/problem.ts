import Router from '@koa/router'
import problemController from '../controllers/problem'
import testcaseController from '../controllers/testcase'
import authnMiddleware from '../middlewares/authn'
import ratelimitMiddleware from '../middlewares/ratelimit'

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

problemRouter.get('/:pid/testcases',
  authnMiddleware.loginRequire,
  testcaseController.findTestcases,
)
problemRouter.post('/:pid/testcases',
  authnMiddleware.loginRequire,
  testcaseController.createTestcase,
)
problemRouter.get('/:pid/testcases/export',
  authnMiddleware.loginRequire,
  ratelimitMiddleware.dataExportLimit,
  testcaseController.exportTestcases,
)
problemRouter.get('/:pid/testcases/:uuid.:type',
  authnMiddleware.loginRequire,
  testcaseController.getTestcase,
)
problemRouter.del('/:pid/testcases/:uuid',
  authnMiddleware.loginRequire,
  testcaseController.removeTestcase,
)

problemRouter.get('/:pid/discussions',
  problemController.findProblemDiscussions,
)

export default problemRouter
