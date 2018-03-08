require('./config/db')
const { resolve } = require('path')
const fse = require('fs-extra')
const range = require('lodash.range')
const shell = require('shelljs')
const fetch = require('node-fetch')
const uuid = require('uuid/v4')
const ID = require('./models/ID')
const User = require('./models/User')
const Problem = require('./models/Problem')
const Contest = require('./models/Contest')
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

async function ranklistBuild () {
  async function update (contest) {
    const ranklist = {}
    const { cid } = contest
    const solutions = await Solution.find({
      mid: cid
    })
    for (const solution of solutions) {
      const { uid } = solution
      const row = (uid in ranklist) ? ranklist[uid] : { uid }
      const { pid } = solution
      const item = (pid in row) ? row[pid] : {}
      if ('wa' in item) {
        if (item.wa >= 0) continue
        if (solution.judge === config.judge.Accepted) {
          item.wa = -item.wa
          item.create = solution.create
        } else item.wa --
      } else {
        if (solution.judge === config.judge.Accepted) {
          item.wa = 0
          item.create = solution.create
        } else item.wa = -1
      }
      row[pid] = item
      ranklist[uid] = row
    }
    contest.ranklist = ranklist
    return contest.save()
  }
  const contests = await Contest.find({}).exec()
  return Promise.all(contests.map(update))
}

/*
对原有的 testcase 增加 id 标记
*/
async function testcaseBuild (problem) {
  async function update (problem) {
    const pid = problem.pid

    // testdata
    if (!fse.existsSync(path.resolve(__dirname, `./data/${pid}/test.in`))) {
      return
    }
    const solutions = await Solution.find({ pid }).exec()
    const meta = {
      testcases: []
    }
    const newid = uuid()
    meta.testcases.push({
      uuid: newid
    })
    await Promise.all([
      fse.copy(path.resolve(__dirname, `./data/${pid}/test.in`), path.resolve(__dirname, `./data/${pid}/${newid}.in`)),
      fse.copy(path.resolve(__dirname, `./data/${pid}/test.out`), path.resolve(__dirname, `./data/${pid}/${newid}.out`)),
      fse.writeJson(path.resolve(__dirname, `./data/${pid}/meta.json`), meta, { spaces: 2 })
    ])
    solutions.forEach((solution) => {
      solution.testcases = [{
        uuid: newid,
        judge: solution.judge,
        time: solution.time,
        memory: solution.memory
      }]
    })
    return Promise.all(solutions.map(s => s.save()))
  }
  if (process.env.UPGRADE === 'yes') {
    const problems = await Problem.find().exec()
    return Promise.all(problems.map(update))
  }
}

function main () {
  return Promise.all([
    judgeSetup(),
    databaseSetup(),
    staticFilesSetUp(),
    ranklistBuild(),
    testcaseBuild()
  ])
}

main()
  .catch(err => {
    console.error(err)
    process.exit(-1)
  })
