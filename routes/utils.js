const Router = require('koa-router')
const utils = require('../controllers/utils')
const { auth } = require('../utils/middlewares')

const router = new Router()

router.post('/submit', auth.admin, utils.submit)

module.exports = router
