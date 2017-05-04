const Router = require('koa-router')
const status = require('../controllers/status')
const { loginRequired, adminRequired, idNumberRequired } = require('../middlewares')

const router = new Router({
  prefix: '/status'
})

router.get('/', status.queryList)
router.get('/:sid', idNumberRequired('sid'), loginRequired, status.queryOneSolution)
router.post('/', loginRequired, status.create)
router.put('/:sid', idNumberRequired('sid'), loginRequired, adminRequired, status.rejudge)

module.exports = router
