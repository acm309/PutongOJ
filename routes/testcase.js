/**
 * 还没想好 URL 写成什么样子
 * 但有几个注意事项:
 * 所有的请求仅管理员有权操作，所以必须增加中间件验证身份
 */
const Router = require('koa-router')
const testcase = require('../controllers/testcase')
const { auth } = require('../utils/middlewares')

const router = new Router({
  prefix: '/testcase'
})

router.get('/:pid', auth.login, auth.admin, testcase.find)
router.get('/:pid/:uuid', auth.login, auth.admin, testcase.fetch)
router.post('/:pid', auth.login, auth.admin, testcase.create)
router.del('/:pid/:uuid', auth.login, auth.admin, testcase.del)

module.exports = router
