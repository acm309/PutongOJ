const Router = require('koa-router')
const testcase = require('../controllers/testcase')
const { auth } = require('../middlewares')

const router = new Router({
  prefix: '/testcase',
})

router.get('/:pid', auth.login, auth.admin, testcase.find)
router.get('/:pid/:uuid', auth.login, auth.admin, testcase.fetch)
router.post('/:pid', auth.login, auth.admin, testcase.create)
router.del('/:pid/:uuid', auth.login, auth.admin, testcase.del)

module.exports = router
