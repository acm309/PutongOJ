const Router = require('koa-router')
const status = require('../controllers/status')
const { loginRequired, adminRequired } = require('../middlewares')

const router = new Router({
  prefix: '/status'
})

router.get('/', status.queryList)
router.get('/:sid', loginRequired, status.queryOneSolution)
router.post('/:sid', loginRequired, status.create)
router.put('/:sid', loginRequired, adminRequired, status.rejudge)

module.exports = router
