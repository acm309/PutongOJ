const { resolve } = require('node:path')
const process = require('node:process')
const { zip } = require('zip-a-folder')

const sourcePath = resolve(__dirname, '../dist')
const targetPath = resolve(__dirname, '../dist.zip')

zip(sourcePath, targetPath)
  .then(() => {
    /* eslint-disable-next-line no-console */
    console.log('✅ 已将 dist 目录打包为 dist.zip')
  })
  .catch((err) => {
    console.error('❌ Oh no，打包失败！')
    console.error(err)
    process.exit(1)
  })
