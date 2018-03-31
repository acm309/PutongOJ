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
const fse = require('fs-extra')
const { resolve } = require('path')
const shell = require('shelljs')

require('../../config/db')
const Solution = require('../../models/Solution')
const Problem = require('../../models/Problem')
const User = require('../../models/User')
const logger = require('../../utils/logger')
const config = require('../../config')
const redis = require('../../config/redis')
const extensions = ['', 'c', 'cpp', 'java']

// 转化代码
// 因为判题端各数字表示的含义与 OJ 默认的不同，因此需要做一次转化
// 比如 判题端的 WrongAnswer 为 6， 而 OJ 内为 5
// 判题端的 judge 代码见 README
// OJ 默认的见 config/index.js
function judgeCode (code) {
  if (isNaN(+code)) {
    throw new Error(`${code}, which has type ${typeof code}, should be able to be converted into a number`)
  }
  code = parseInt(code)
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
  } else {
    return config.judge.RuntimeError
  }
}

async function beforeJudge (sid) {
  const solution = await Solution.findOne({ sid }).exec()
  const problem = await Problem.findOne({ pid: solution.pid }).exec()
  solution.judge = config.judge.Running
  await solution.save() // 将判题状态改为正在判题

  // 复制测试数据和清空上一次的文件夹
  const { pid } = problem
  const dir = resolve(__dirname, `../../data/${pid}`)

  // meta 记录了有哪些数据
  const meta = fse.readJsonSync(resolve(dir, 'meta.json'))

  await Promise.all([
    fse.copy(resolve(dir, 'meta.json'), resolve(__dirname, 'meta.json')),
    fse.emptyDir(resolve(__dirname, 'temp')),
    fse.emptyDir(resolve(__dirname, 'testdata'))
  ])

  // 把所有 testcases 复制过来
  // 输入
  await Promise.all(meta.testcases.map((test) => {
    return fse.copy(resolve(dir, `${test.uuid}.in`), resolve(__dirname, `testdata/${test.uuid}.in`))
  }))

  // 输出
  await Promise.all(meta.testcases.map((test) => {
    return fse.copy(resolve(dir, `${test.uuid}.out`), resolve(__dirname, `testdata/${test.uuid}.out`))
  }))

  fse.writeFileSync(resolve(__dirname, `temp/Main.${extensions[solution.language]}`), solution.code) // 重点
  return { solution, problem }
}

async function judge (problem, solution) {
  shell.exec(`./Judge -l ${solution.language} -D ./testdata -d ./temp -t ${problem.time} -m ${problem.memory} -o 81920`)

  // 查看编译信息，是否错误之类的
  const ce = fse.readFileSync(resolve(__dirname, 'temp/ce.txt'), { encoding: 'utf8' }).trim()
  if (ce) { // 非空，有错
    solution.judge = config.judge.CompileError
    solution.error = ce
    return
  }
  const result = fse.readJsonSync(resolve(__dirname, 'temp/result.json'))

  solution.judge = -1
  solution.time = solution.memory = 0
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
    userUpdate(solution)
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
    `${solution.sid}.${extensions[solution.language]}`
  )
  return fse.outputFile(target, solution.code)
}

// 用 sim 检测，返回相似度 (sim) 以及 最相似的那个提交 (sim_s_id)
async function simTest (solution) {
  const dir = resolve(__dirname, `../../data/${solution.pid}/ac/`)
  // 必须删除上一次的 simfile，否则如果这次没有查出重样，那么程序可能将上一次的 simfile 当作这一次的结果
  await fse.removeSync('./simfile')
  shell.exec(`./sim.sh ./test/Main.${extensions[solution.language]} ${dir} ${extensions[solution.language]}`)
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

/**
 * 如果用户之前没有提交过这题，那么 user.submit += 1
 * 如果用户之前没有 ac 过这题，那么 user.solved += 1
 */
async function userUpdate (solution) {
  const user = await User.findOne({ uid: solution.uid }).exec()
  if (user == null) {
    logger.error(`Excuse me? No such a user with uid "${solution.uid}"`)
    return
  }
  // 这道题之前提交过了么?
  const isSubmittedBefore = await Solution.count({
    uid: user.uid,
    pid: solution.pid,
    sid: { $ne: solution.sid } // 把自身排除
  }).exec()
  if (isSubmittedBefore === 0) {
    user.submit += 1
  }
  if (solution.judge === config.judge.Accepted) {
    // 之前 ac 过了么
    const isAcBefore = await Solution.count({
      uid: user.uid,
      pid: solution.pid,
      sid: { $ne: solution.pid },
      judge: config.judge.Accepted
    }).exec()
    if (isAcBefore === 0) {
      user.solve += 1
    }
  }
  return user.save()
}

async function main () {
  while (1) {
    // 移出并获取oj:solutions列表中的最后一个元素
    const res = await redis.brpop('oj:solutions', 365 * 24 * 60) // one year 最长等一年(阻塞时间)
    const sid = +res[1]
    const { problem, solution } = await beforeJudge(sid)
    logger.info(`Start judge: <sid ${sid}> <pid: ${problem.pid}> by <uid: ${solution.uid}>`)
    await judge(problem, solution)
    await afterJudge(problem, solution)
    logger.info(`End judge: <sid ${sid}> <pid: ${problem.pid}> by <uid: ${solution.uid}> with result ${solution.judge}`)
  }
}

main()
  .then(() => logger.info('starting'))
  .catch(e => logger.error(e))
