const { existsSync, mkdirSync, cpSync, rmSync } = require('node:fs')
const { resolve } = require('node:path')

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

const ignoreFiles = [
  'images', 'ts', 'types',
  'index.d.ts', 'index.js', 'index.min.js', 'method.d.ts', 'method.js',]

ignoreFiles.forEach((file) => {
  rmSync(resolve(targetPath, file), { recursive: true, force: true })
})

console.log(`Vditor ${version} has been successfully copied to public directory`)
