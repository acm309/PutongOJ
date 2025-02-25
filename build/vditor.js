const { resolve } = require('node:path')
const { existsSync, rmSync, mkdirSync, cpSync } = require('node:fs')

const vditorPath = resolve(__dirname, '../node_modules/vditor')
const { version } = require(resolve(vditorPath, 'package.json'))
const staticPath = resolve(__dirname, `../public/static/vditor-${version}`)
const sourcePath = resolve(vditorPath, 'dist')
const targetPath = resolve(staticPath, 'dist')

if (!existsSync(vditorPath)) {
  console.error('Please install dependencies first: pnpm install')
  process.exit(1)
}

if (existsSync(staticPath)) rmSync(staticPath, { recursive: true, force: true })
mkdirSync(staticPath, { recursive: true })

if (!existsSync(sourcePath)) {
  console.error(`Source path does not exist: ${sourcePath}`)
  process.exit(1)
}

cpSync(sourcePath, targetPath, { recursive: true, force: true })
console.log(`Vditor ${version} has been successfully copied to public directory`)
