require('./config/db')
const { resolve } = require('path')
const fse = require('fs-extra')
const range = require('lodash.range')
const shell = require('shelljs')
const fetch = require('node-fetch')
const ID = require('./models/ID')
const User = require('./models/User')
const Problem = require('./models/Problem')
const config = require('./config')
const { generatePwd } = require('./utils/helper')

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
      env: {
        'NODE_ENV': 'production'
      }
    },
    {
      name: 'updater',
      script: resolve(__dirname, 'judgers', `updater.js`),
      'out_file': resolve(logDir, `updater.out.log`),
      'error_file': resolve(logDir, `updater.err.log`),
      'log_date_format': 'YYYY-MM-DD HH:mm:ss X',
      'merge_logs': true
    }
  ]
}

async function judgeSetup () {
  let judgers = +config.judgers
  if (!(judgers >= 1 && judgers <= 10)) judgers = 1

  const judgersDir = resolve(__dirname, 'judgers')

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
      'merge_logs': true
    })
  )

  return fse.outputJSON('pm2.config.json', pm2config, { spaces: 2, EOL: '\n' })
}

async function databaseSetup () {
  const models = [
    'Solution', 'Contest', 'News', 'Group'
  ]
  const ps = models.map(async (model) => {
    const item = await ID.findOne({ name: model }).exec()
    if (item != null && item.id >= 0) return
    return new ID({ name: model, id: 0 }).save()
  })

  const admin = await User.findOne({uid: 'admin'}).exec()
  if (admin == null) {
    ps.push(new User({
      uid: 'admin',
      nick: 'admin',
      pwd: generatePwd(config.deploy.adminInitPwd)
    }).save())
  }

  const count = await Problem.count().exec()
  if (count === 0) {
    ps.push(new Problem({
      description: 'This is a test problem without any test data. Go to Edit tab to complete the description and other fields. Go to Test Data to upload new test data'
    }).save())
  }
  return Promise.all(ps)
}

async function staticFilesSetUp () {
  const res = await fetch('https://api.github.com/repos/acm309/PutongOJ-FE/releases')
  const json = res.json()
  const url = json[0].assets[0].browser_download_url
  shell.exec(`wget ${url} -O dist.zip`)
  shell.exec(`unzip dist.zip -d dist`)
  shell.exec(`cp -r dist/* public/`)
}

async function main () {
  return Promise.all([
    judgeSetup(),
    databaseSetup(),
    staticFilesSetUp()
  ])
}

main()
  .catch(err => {
    console.error(err)
    process.exit(-1)
  })
