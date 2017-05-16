const Router = require('koa-router')
const home = require('../controllers/home')
const { loginRequired, adminRequired } = require('../middlewares')

const router = new Router({
  prefix: ''
})

router.get('/servertime', home.servertime)
router.post('/submit', loginRequired, adminRequired, home.submit)

module.exports = router
