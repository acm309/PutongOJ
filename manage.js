const { resolve } = require('path')
const fse = require('fs-extra')
const range = require('lodash.range')
const shell = require('shelljs')
const fetch = require('node-fetch')
const config = require('./config')

// download and initialize the judgers
// start !

const logDir = resolve(__dirname, 'logs')

const baseConfig = {
  apps: [
    {
      name: 'app',
      script: resolve(__dirname, `app.js`),
      'out_file': resolve(logDir, `app.out.log`),
      'error_file': resolve(logDir, `app.err.log`),
      'log_date_format': 'YYYY-MM-DD HH:mm:ss X',
      'merge_logs': true,
      'restart_delay': 500,
      env: {
        'NODE_ENV': 'production'
      }
    },
    {
      name: 'updater',
      script: resolve(__dirname, 'services', `updater.js`),
      'out_file': resolve(logDir, `updater.out.log`),
      'error_file': resolve(logDir, `updater.err.log`),
      'log_date_format': 'YYYY-MM-DD HH:mm:ss X',
      'merge_logs': true
    }
  ]
}

if (config.mail && config.mail.enable) {
  baseConfig.apps.push({
    name: 'mailer',
    script: resolve(__dirname, 'services', `mailer.js`),
    'out_file': resolve(logDir, `mailer.out.log`),
    'error_file': resolve(logDir, `mailer.err.log`),
    'log_date_format': 'YYYY-MM-DD HH:mm:ss X',
    'merge_logs': true
  })
}

async function judgeSetup () {
  let judgers = +config.judgers
  if (!(judgers >= 1 && judgers <= 10)) judgers = 1

  const judgersDir = resolve(__dirname, 'services')

  await fse.emptyDir(resolve(judgersDir, 'Judger'))

  // 下载最新版的 judger
  shell.exec(`git clone 'https://github.com/acm309/Judger' ${resolve(judgersDir, 'Judger')}`)
  shell.exec(`make -C ${resolve(judgersDir, 'Judger')}`)

  await Promise.all([
    fse.copy(resolve(judgersDir, 'Judger', 'Judge'), resolve(judgersDir, 'node-0', 'Judge')),
    fse.copy(resolve(judgersDir, 'Judger', 'config.ini'), resolve(judgersDir, 'node-0', 'config.ini'))
  ])

  await Promise.all(
    range(1, judgers)
      .map(i => fse.copy(
        resolve(judgersDir, 'node-0'),
        resolve(judgersDir, `node-${i}`)
      ))
  )

  const pm2config = baseConfig

  range(judgers).forEach(i =>
    pm2config.apps.push({
      name: `node-${i}`,
      script: resolve(judgersDir, `node-${i}/judger.js`),
      'out_file': resolve(logDir, `node-${i}-out.log`),
      'error_file': resolve(logDir, `node-${i}-err.log`),
      'log_date_format': 'YYYY-MM-DD HH:mm:ss X',
      'merge_logs': true,
      cwd: resolve(judgersDir, `node-${i}`)
    })
  )

  return fse.outputJSON('pm2.config.json', pm2config, { spaces: 2, EOL: '\n' })
}

async function staticFilesSetUp () {
  const res = await fetch('https://api.github.com/repos/acm309/PutongOJ-FE/releases')
  const json = await res.json()
  const url = json[0].assets[0].browser_download_url
  shell.exec(`wget ${url} -O dist.zip`)
  shell.exec(`unzip -o dist.zip -d dist`)
  shell.exec(`cp -r dist/* public/`)
}

function main () {
  return Promise.all([
    judgeSetup(),
    staticFilesSetUp()
  ])
}

main()
  .then(() => {
    console.log('ok')
    process.exit(0)
  })
  .catch(err => {
    console.error(err)
    process.exit(-1)
  })
