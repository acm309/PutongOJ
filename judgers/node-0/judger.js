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
const path = require('path')
const shell = require('shelljs')

require('../../config/db')
const Solution = require('../../models/Solution')
const Problem = require('../../models/Problem')
const logger = require('../../utils/logger')
const config = require('../..//config')
const redis = require('../../config/redis')

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
  } else if (code === 14) {
    return config.judge.SystemError
  } else {
    return config.judge.RuntimeError
  }
}

async function judge (problem, solution) {
  const { pid } = problem
  const dir = path.resolve(__dirname, `../../data/${pid}`)
  // meta 记录了有哪些数据
  const meta = fse.readJsonSync(path.resolve(dir, 'meta.json'))
  await fse.copy(path.resolve(dir, 'meta.json'), path.resolve(__dirname, 'meta.json'))

  await fse.emptyDir(path.resolve(__dirname, 'temp'))

  // 把所有 testcases 复制过来
  // 输入
  await Promise.all(meta.testcases.map((test) => {
    return fse.copy(path.resolve(dir, `${test.uuid}.in`), path.resolve(dir, `testdata/${test.uuid}.in`))
  }))

  // 输出
  await Promise.all(meta.testcases.map((test) => {
    return fse.copy(path.resolve(dir, `${test.uuid}.out`), path.resolve(dir, `testdata/${test.uuid}.out`))
  }))

  logger.warn('TODO: implement language detection')
  fse.writeFileSync(path.resolve(__dirname, `temp/Main.cpp`), solution.code)

  shell.exec(`./Judge -l 2 -D ./testdata -d temp -t ${problem.time} -m ${problem.memory} -o 81920`)

  // 查看编译信息，是否错误之类的
  const ce = fse.readFileSync(path.resolve(__dirname, 'temp/ce.txt'), { encoding: 'utf8' }).trim()
  if (ce) { // 非空，有错
    solution.judge = config.judge.CompileError
    solution.error = ce
    return
  }
  const result = fse.readJsonSync(path.resolve(__dirname, 'temp/result.json'))

  solution.judge = -1
  for (const item of result) {
    item.result = judgeCode(item.result)
    if (item.result !== config.judge.Accepted && solution.judge === -1) {
      solution.judge = item.result
    }
  }
  if (solution.judge === -1) {
    solution.judge = config.judge.Accepted
  }
  solution.testcases = result
  return solution
}

async function main () {
  while (1) {
    const res = await redis.brpop('oj:solutions', 365 * 24 * 60) // one year
    const sid = +res[1]
    const solution = await Solution.findOne({ sid }).exec()
    const problem = await Problem.findOne({ pid: solution.pid }).exec()
    logger.info(`Start judge: <sid ${sid}> <pid: ${problem.pid}> by <uid: solution.uid>`)
    judge(problem, solution)
    await solution.save()
    logger.info(`End judge: <sid ${sid}> <pid: ${problem.pid}> by <uid: ${solution.uid}> with result ${solution.judge}`)
    logger.warn(`TODO: sim test and update user info`)
  }
}

main()
  .then(() => 'starting')
  .catch(e => logger.error(e))
