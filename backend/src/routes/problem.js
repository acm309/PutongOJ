const Router = require('koa-router')

// const {
//   courseAware,
//   coursePreload,
//   courseRoleRequire,
// } = require('../controllers/course')
const {
  problemPreload,
  findProblems,
  getProblem,
  createProblem,
  updateProblem,
  removeProblem,
} = require('../controllers/problem')
const { auth: {
  login: loginRequire,
  admin: adminPrivilegeRequire,
} } = require('../middlewares')

const problemRouter = new Router({ prefix: '/problem' })

// Problems
problemRouter.get('/',
  // courseAware([
  //   loginRequire,
  //   coursePreload,
  //   courseRoleRequire('basic'),
  // ]),
  findProblems,
)
problemRouter.post('/',
  loginRequire,
  adminPrivilegeRequire,
  createProblem,
)

// Problem
problemRouter.get('/:pid',
  problemPreload,
  getProblem,
)
problemRouter.put('/:pid',
  loginRequire,
  adminPrivilegeRequire,
  problemPreload,
  updateProblem,
)
problemRouter.del('/:pid',
  loginRequire,
  adminPrivilegeRequire,
  removeProblem,
)

module.exports = problemRouter
