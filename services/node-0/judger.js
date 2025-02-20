/**
 * 基本思路:
 * 1. 从 redis 拿到需要 judge 的提交的 sid
 * 2. 取到对应的 Solution 和 Problem
 * 3. 判题 (judge) 函数
 * 4. 更新 Solution
 * 5. 如果 AC, 需要查重 (sim_test)
 * 6. 更新用户的 Submit 和 Solve
 * 7. 结束，再次从第一步开始
 */
require('dotenv-flow').config({
  path: '../../',
})

const { resolve } = require('node:path')
const fse = require('fs-extra')
const { command: execaCommand } = require('execa')

require('../../config/db')
const Solution = require('../../models/Solution')
const Problem = require('../../models/Problem')
const User = require('../../models/User')
const logger = require('../../utils/logger')
const config = require('../../config')
const redis = require('../../config/redis')

const extensions = [ '', 'c', 'cpp', 'java', 'py' ]

// 转化代码
// 因为判题端各数字表示的含义与 OJ 默认的不同，因此需要做一次转化
// 比如 判题端的 WrongAnswer 为 6， 而 OJ 内为 5
// 判题端的 judge 代码见 README
// OJ 默认的见 config/index.js
function judgeCode (code) {
  if (Number.isNaN(+code)) {
    throw new TypeError(`${code}, which has type ${typeof code}, should be able to be converted into a number`)
  }
  code = Number.parseInt(code)
  if (code === 2) {
    return config.judge.Accepted
  } else if (code === 3) {
    return config.judge.PresentationError
  } else if (code === 4) {
    return config.judge.TimeLimitExceeded
  } else if (code === 5) {
    return config.judge.MemoryLimitExceed
  } else if (code === 6) {
    return config.judge.WrongAnswer
  } else if (code === 7) {
    return config.judge.OutputLimitExceed
  } else if (code === 8) {
    return config.judge.CompileError
  } else if (code === 14) {
    return config.judge.SystemError
  } else if (code === 16) {
    return config.judge.Skipped
  } else {
    return config.judge.RuntimeError
  }
}

async function fetchProblemAndSolution (sid) {
  const solution = await Solution.findOne({ sid }).exec()
  if (solution == null) { return null }
  const problem = await Problem.findOne({ pid: solution.pid }).exec()
  if (problem == null) { return null }
  return { solution, problem }
}

async function beforeJudge (problem, solution) {
  solution.judge = config.judge.Running
  await solution.save() // 将判题状态改为正在判题

  // 复制测试数据和清空上一次的文件夹
  const { pid } = problem
  const spj = problem.spj || false
  const spjcode = problem.spjcode || ''
  const dir = resolve(__dirname, `../../data/${pid}`)

  // meta 记录了有哪些数据
  const meta = fse.readJsonSync(resolve(dir, 'meta.json'))

  await Promise.all([
    fse.copy(resolve(dir, 'meta.json'), resolve(__dirname, 'meta.json')),
    fse.emptyDir(resolve(__dirname, 'temp')),
    fse.emptyDir(resolve(__dirname, 'testdata')),
  ])

  // 把所有 testcases 复制过来
  await Promise.all(meta.testcases.map((test) => { // 输入
    return fse.copy(resolve(dir, `${test.uuid}.in`), resolve(__dirname, `testdata/${test.uuid}.in`))
  }))
  await Promise.all(meta.testcases.map((test) => { // 输出
    return fse.copy(resolve(dir, `${test.uuid}.out`), resolve(__dirname, `testdata/${test.uuid}.out`))
  }))

  fse.writeFileSync(resolve(__dirname, `temp/Main.${extensions[solution.language]}`), solution.code) // 重点
  if (spj) { fse.writeFileSync(resolve(__dirname, 'testdata/spj.cpp'), spjcode) }

  return { solution, problem }
}

async function judge (problem, solution) {
  // 判题命令
  let judge_command = './Judge '
  judge_command += `-l ${solution.language} `
  judge_command += `-D ./testdata `
  judge_command += `-d ./temp `
  judge_command += `-t ${problem.time} `
  judge_command += `-m ${problem.memory} `
  judge_command += `-o 81920`
  if (problem.spj) { judge_command += ' -S tt' }

  // 进行判题
  await execaCommand(judge_command)

  // 查看编译信息，是否错误之类的
  const ce = fse.readFileSync(resolve(__dirname, 'temp/ce.txt'), { encoding: 'utf8' }).trim()
  if (ce) { // 非空，有错
    solution.judge = config.judge.CompileError
    solution.error = ce
    return solution
  }

  solution.time = solution.memory = 0

  if (!fse.existsSync(resolve(__dirname, 'temp/result.json'))) {
    solution.judge = config.judge.SystemError
    logger.error(`${resolve(__dirname, 'temp/result.json')} does not exist`)
    logger.error(`${solution}`)
    return solution
  }

  const result = fse.readJsonSync(resolve(__dirname, 'temp/result.json'))

  solution.judge = -1
  for (const item of result) {
    item.judge = judgeCode(item.judge)
    solution.time = Math.max(solution.time, item.time)
    solution.memory = Math.max(solution.memory, item.memory)
    if (item.judge !== config.judge.Accepted && solution.judge === -1) {
      solution.judge = item.judge
    }
  }
  if (solution.judge === -1) {
    solution.judge = config.judge.Accepted
  }
  solution.testcases = result
  return solution
}

async function afterJudge (problem, solution) {
  if (solution.judge === config.judge.Accepted) { // 作对的话要进行 sim 测试，判断是否有 "抄袭" 可能
    const sim = await simTest(solution)
    if (sim.sim !== 0) { // 有 "抄袭可能"
      solution.sim = sim.sim
      solution.sim_s_id = sim.sim_s_id
    }
  }
  return Promise.all([
    solution.save(),
    solutionArchive(solution),
    userUpdate(solution),
  ])
}

// 如果作对了，就要把这个提交的代码保存到另一个文件夹中
async function solutionArchive (solution) {
  if (solution.judge !== config.judge.Accepted) {
    return
  }
  const target = resolve(
    __dirname,
    `../../data/${solution.pid}/ac/`,
    `${solution.sid}.${extensions[solution.language]}`,
  )
  return fse.outputFile(target, solution.code)
}

// 用 sim 检测，返回相似度 (sim) 以及 最相似的那个提交 (sim_s_id)
async function simTest (solution) {
  const dir = resolve(__dirname, `../../data/${solution.pid}/ac/`)
  // 必须删除上一次的 simfile，否则如果这次没有查出重样，那么程序可能将上一次的 simfile 当作这一次的结果
  await fse.removeSync('./simfile')
  await execaCommand(`./sim.sh ./temp/Main.${extensions[solution.language]} ${dir} ${extensions[solution.language]}`)
  if (fse.existsSync('./simfile')) {
    const simfile = await fse.readFile('./simfile')
    const result = simfile.toString().match(/(\d+)\s+(\d+)/)
      ;[ solution.sim, solution.sim_s_id ] = [ +result[1], +result[2] ]
  }
  return {
    sim: solution.sim || 0,
    sim_s_id: solution.sim_s_id || 0,
  }
}

/**
 * 如果用户之前没有提交过这题，那么 user.submit += 1, problem.submit += 1
 * 如果用户之前没有 ac 过这题，那么 user.solved += 1, problem.solved += 1
 */
async function userUpdate (solution) {
  const user = await User.findOne({ uid: solution.uid }).exec()
  if (user == null) {
    logger.error(`Excuse me? No such a user with uid "${solution.uid}"`)
    return
  }
  const problem = await Problem.findOne({ pid: solution.pid }).exec()
  if (problem == null) {
    logger.error(`Excuse me? No such a problem with pid "${solution.pid}"`)
  }
  // 这道题之前提交过了么?
  const isSubmittedBefore = await Solution.count({
    uid: user.uid,
    pid: solution.pid,
    sid: { $ne: solution.sid }, // 把自身排除
  }).exec()
  if (isSubmittedBefore === 0) {
    await User.findOneAndUpdate({
      uid: user.uid,
    }, {
      $inc: {
        submit: 1,
      },
    }).exec()
    await Problem.findOneAndUpdate({
      pid: problem.pid,
    }, {
      $inc: {
        submit: 1,
      },
    }).exec()
  }
  console.log('submit', isSubmittedBefore)
  if (solution.judge === config.judge.Accepted) {
    // 之前 ac 过了么
    const isAcBefore = await Solution.count({
      uid: user.uid,
      pid: solution.pid,
      sid: { $ne: solution.sid },
      judge: config.judge.Accepted,
    }).exec()
    console.log('isAc', isAcBefore)
    if (isAcBefore === 0) {
      await User.findOneAndUpdate({
        uid: user.uid,
      }, {
        $inc: {
          solve: 1,
        },
      }).exec()
      await Problem.findOneAndUpdate({
        pid: problem.pid,
      }, {
        $inc: {
          solve: 1,
        },
      }).exec()
    }
  }
}

async function main () {
  await execaCommand(`chmod 755 ${resolve(__dirname, 'sim_text')}`)
  await execaCommand(`chmod 755 ${resolve(__dirname, 'sim.sh')}`)
  while (1) {
    // 移出并获取oj:solutions列表中的最后一个元素
    const res = await redis.brpop('oj:solutions', 365 * 24 * 60) // one year 最长等一年(阻塞时间)
    if (res == null) { continue }
    const sid = +res[1]
    const baseInfo = await fetchProblemAndSolution(sid)
    if (baseInfo == null) {
      logger.info(`Start judge: <sid ${sid}> null`)
      continue
    }
    const { problem, solution } = baseInfo
    try {
      await beforeJudge(problem, solution)
      logger.info(`Start judge: <sid ${sid}> <pid: ${problem.pid}> by <uid: ${solution.uid}>`)
      await judge(problem, solution)
    } catch (e) {
      logger.error(`System Error: <sid ${sid}> <pid: ${problem.pid}> by <uid: ${solution.uid}>`)
      logger.error(`${e}`)
      solution.judge = config.judge.SystemError
    }
    await afterJudge(problem, solution)
    logger.info(`End judge: <sid ${sid}> <pid: ${problem.pid}> by <uid: ${solution.uid}> with result ${solution.judge}`)
    if (solution.mid) {
      redis.lpush('oj:contest:solution', solution.sid)
    }
  }
}

main()
  .then(() => logger.info('starting'))
  .catch(e => logger.error(e))
