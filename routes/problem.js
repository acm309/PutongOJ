const problem = require('../controllers/problem')
const Router = require('koa-router')
const { auth } = require('../utils/middlewares')

const router = new Router({
  prefix: '/problem'
})

router.get('/list', problem.list)
router.get('/:pid', problem.preload, problem.findOne)
router.post('/', auth.login, auth.admin, problem.create)
router.put('/:pid', auth.login, auth.admin, problem.preload, problem.update)
router.del('/:pid', auth.login, auth.admin, problem.del)

module.exports = router
