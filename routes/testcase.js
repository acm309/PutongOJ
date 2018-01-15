/**
 * 还没想好 URL 写成什么样子
 * 但有几个注意事项:
 * 所有的请求仅管理员有权操作，所以必须增加中间件验证身份
 */
const testcase = require('../controllers/testcase.js')
const Router = require('koa-router')
const { auth } = require('../utils/middlewares')

const router = new Router({
  prefix: '/testcase'
})

router.get('/:pid', testcase.find)
router.get('/:pid/:uuid', testcase.findOne)
router.post('/:pid', auth.login, auth.admin, testcase.create)
router.put('/:pid/:uuid', auth.login, auth.admin, testcase.update)
router.del('/:pid/:uuid', auth.login, auth.admin, testcase.del)

module.exports = router
