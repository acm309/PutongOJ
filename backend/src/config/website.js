const { env } = require('node:process')

module.exports = {
  title: env.title || 'Putong OJ',
  buildSHA: env.NODE_BUILD_SHA || 'unknown',
  buildTime: Number.parseInt(env.NODE_BUILD_TIME) || Date.now(),
}
