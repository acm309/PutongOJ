const redis = require('redis')
const config = require('../../config')
const client = redis.createClient(config.redisUrl)
const mongoose = require('mongoose')
const { redisLPUSH } = require('../../utils')
mongoose.Promise = global.Promise

const Solution = require('../../models/Solution')
const User = require('../../models/User')
const Problem = require('../../models/Problem')
const shell = require('shelljs')
const path = require('path')
const fse = require('fs-extra')
const logger = require('winston')
const isRoot = require('is-root')
const root = './test'
const solutionTag = 'solutions'
const extension = ['', 'c', 'cpp', 'java']

// 所有文件都叫 Main.xxx; 这样方便设计。同时，反正 java 文件也必须叫 Main

mongoose.connect(config.mongoUrl)

logger.default.transports.console.colorize = true

// 判题端 (Core) 需要 root 权限
if (!isRoot()) {
  logger.error('You must run this program as root')
  process.exit(0)
}

logger.info('Start successfully:')

function transToCode (judge) {
  return {
    'Compile Error': 2,
    'Accepted': 3,
    'Runtime Error': 4,
    'Wrong Answer': 5,
    'Time Limit Exceeded': 6,
    'Memory Limit Exceeded': 7,
    'Output Limit Exceeded': 8,
    'Presentation Error': 9,
    'System Error': 10
  }[judge]
}

// 检查当前文件夹，后面的程序主要都在这个程序中执行
async function init (root) {
  if (!fse.existsSync(root) || !fse.lstatSync(root).isDirectory()) {
    fse.removeSync(root)
    fse.mkdirs(root)
  }
}

function brpop (...args) {
  return new Promise((resolve, reject) => {
    client.brpop(...args, function (err, res) {
      if (err) reject(err)
      resolve(res)
    })
  })
}

async function fetchSid (tag) {
  const result = await brpop('solutions', 3600 * 24 * 365)
  if (result === null) {
    logger.error('Wait for too long time...')
    process.exit(-1)
  }
  return +result[1]
}

async function judgeRun ({ pid, language, code },
  { time: timeLimit, memory: memoryLimit, in: sampleIn, out: sampleOut }) {
  const filename = ['Main.c', 'Main.cpp', 'Main.java'][language - 1]
  let [judge, time, memory, error, content] = ['Accepted', 0, 0, '', ''] // default
  if (sampleIn.trim() || sampleIn.trim()) {
    // if both sampleIn and sampleOut are empty
    // then do nothing
    await Promise.all([
      fse.copy(`../Data/${pid}/sample.in`, './test/in.in'),
      fse.copy(`../Data/${pid}/sample.out`, './test/out.out'),
      fse.writeFile(`./test/${filename}`, code)
    ])

    // run in root
    // ./Core -c ./test/main.cpp -t 1000 -m 65535 -d ./test/
    shell.exec(`./Core -c ${'./test/' + filename} -t ${timeLimit} -m ${memoryLimit} -d ./test/`)
    content = await fse.readFile('./test/result.txt', {encoding: 'utf8'})
    ;[judge, time, memory, ...error] = content.trim().split('\n')
    error = error.join('\n')
  } else {
    await fse.writeFile(`./test/${filename}`, code)
  }

  if (judge !== 'Accepted' ||
  !fse.existsSync(`../Data/${pid}/test.in`) ||
  !fse.existsSync(`../Data/${pid}/test.out`)) {
    return {
      judge,
      time: +time,
      memory: +memory,
      error
    }
  }

  await Promise.all([
    fse.copy(`../Data/${pid}/test.in`, './test/in.in'),
    fse.copy(`../Data/${pid}/test.out`, './test/out.out')
    // fse.writeFile(`./test/${filename}`, code) // file has been writen just now
  ])
  shell.exec(`./Core -c ${'./test/' + filename} -t ${timeLimit} -m ${memoryLimit} -d ./test/`)
  content = await fse.readFile('./test/result.txt', {encoding: 'utf8'})
  ;[judge, time, memory, ...error] = content.trim().split('\n') // ';' is fatal
  error = error.join('\n')
  return {
    judge,
    time: +time,
    memory: +memory,
    error
  }
}

// 用 sim 检测，返回相似度 (sim) 以及 最相似的那个提交 (sim_s_id)
async function simTest (solution) {
  const dir = path.resolve(`../Data/${solution.pid}/ac/`)
  // 必须删除上一次的 simfile，否则如果这次没有查出重样，那么程序可能将上一次的 simfile 当作这一次的结果
  await fse.removeSync('./simfile')
  shell.exec(`./sim.sh ./test/Main.${extension[solution.language]} ${dir} ${extension[solution.language]}`)
  if (fse.existsSync('./simfile')) {
    const simfile = await fse.readFile('./simfile')
    const result = simfile.toString().match(/(\d+)\s+(\d+)/)
    ;[solution.sim, solution.sim_s_id] = [+result[1], +result[2]]
  }
  return {
    sim: solution.sim || 0,
    sim_s_id: solution.sim_s_id || 0
  }
}

// 所有正确的提交需要放到一个文件夹下
async function addToACCategory (solution) {
  await fse.ensureDir(path.resolve(`../Data/${solution.pid}/ac`))

  const p = path.resolve(`../Data/${solution.pid}/ac/${solution.sid}.${extension[solution.language]}`)
  await fse.ensureFile(p)
  await fse.writeFile(p, solution.code)
  logger.info(`Solution ${solution.sid} has been added to ac category of ${solution.pid}`)
}

async function main () {
  while (true) {
    const sid = await fetchSid(solutionTag)
    logger.info(`Solution ${sid} has been received`)
    const solution = await Solution.findOne({sid}).exec()
    if (solution === null) {
      throw new Error(`No such a solution: ${sid}`)
    }
    await init(root)
    solution.judge = config.judge.Running
    await solution.save()
    const [problem, user] = await Promise.all([
      Problem.findOne({pid: solution.pid}).exec(),
      User.findOne({uid: solution.uid}).exec()
    ])
    logger.info(`Solution ${sid} is on judging and running`)

    const result = await judgeRun(solution, problem)

    solution.judge = transToCode(result.judge)
    ;[solution.time, solution.memory, solution.error] = [result.time, result.memory, result.error]

    if (solution.judge === config.judge.Accepted) {
      const { sim, sim_s_id } = await simTest(solution)
      ;[solution.sim, solution.sim_s_id] = [ sim, sim_s_id ]
      logger.info(`Sim test for Solution ${solution.sid}: ${sim}% for ${sim_s_id}`)
      await addToACCategory(solution)
    }
    await solution.save()
    logger.info(`Solution ${solution.pid} has been judged and the judge code is ${result.judge}`)

    // 保存了再更新比赛
    if (solution.module === config.module.Contest) {
      await redisLPUSH('contests', solution.sid)
    }

    const ac = await Solution.findOne({
      sid: {$ne: solution.sid}, // 这一条不算进去
      uid: user.uid,
      pid: solution.pid,
      judge: config.judge.Accepted
    }).exec()

    const submit = await Solution.findOne({
      sid: {$ne: solution.sid},
      pid: solution.pid,
      uid: user.uid
    }).exec()

    const update = {
      $inc: {
        submit: submit ? 0 : 1, // 提交过了就不更新了,
        solve: !ac && solution.judge === config.judge.Accepted
          ? 1 : 0 // 没有ac 过，但这次 ac 了 所有更新
      }
    }

    await Promise.all([
      Problem.findOneAndUpdate({pid: solution.pid}, update).exec(),
      User.findOneAndUpdate({uid: solution.uid}, update).exec()
    ])

    logger.info(`Solve and submit have been updated`)
  }
}

main()
