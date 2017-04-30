const Router = require('koa-router')
const statistics = require('../controllers/statistics')

const router = new Router({
  prefix: '/statistics'
})

router.get('/:pid', statistics.statistics)

module.exports = router
