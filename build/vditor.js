const { resolve } = require('node:path')
const { existsSync, mkdirSync, cpSync } = require('node:fs')

const vditorPath = resolve(__dirname, '../node_modules/vditor')

if (!existsSync(vditorPath)) {
  console.error('Please install dependencies first: pnpm install')
  process.exit(1)
}

const { version } = require(resolve(vditorPath, 'package.json'))
const staticPath = resolve(__dirname, `../public/static/vditor-${version}`)

if (existsSync(staticPath)) {
  process.exit(0)
}

const sourcePath = resolve(vditorPath, 'dist')
const targetPath = resolve(staticPath, 'dist')

mkdirSync(staticPath, { recursive: true })
cpSync(sourcePath, targetPath, { recursive: true, force: true })

console.log(`Vditor ${version} has been successfully copied to public directory`)
