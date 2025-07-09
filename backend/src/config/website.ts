import { env } from 'node:process'

export default module.exports = Object.freeze({
  title: env.title || 'Putong OJ',
  buildSHA: env.NODE_BUILD_SHA || 'unknown',
  buildTime: Number.parseInt(env.NODE_BUILD_TIME as string) || Date.now(),
})
