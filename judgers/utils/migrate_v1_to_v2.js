require('../../config/db')
const Solution = require('../../models/Solution')
const Problem = require('../../models/Problem')
const Contest = require('../../models/Contest')
const config = require('../config')

const uuid = require('uuid/v4')
const fse = require('fs-extra')
const path = require('path')

async function helper (problem) {
  const pid = problem.pid

  // testdata
  if (!fse.existsSync(path.resolve(__dirname, `../../data/${pid}/test.in`))) {
    return
  }
  console.log(problem.pid)
  const solutions = await Solution.find({ pid })
  const meta = {
    testcases: []
  }
  const newid = uuid()
  meta.testcases.push({
    uuid: newid
  })
  await Promise.all([
    fse.copy(path.resolve(__dirname, `../../data/${pid}/test.in`), path.resolve(__dirname, `../../data/${pid}/${newid}.in`)),
    fse.copy(path.resolve(__dirname, `../../data/${pid}/test.out`), path.resolve(__dirname, `../../data/${pid}/${newid}.out`)),
    fse.writeJson(path.resolve(__dirname, `../../data/${pid}/meta.json`), meta, { spaces: 2 })
  ])
  solutions.forEach((solution) => {
    solution.testcases = [{
      uuid: newid,
      judge: solution.judge,
      time: solution.time,
      memory: solution.memory
    }]
  })
  await Promise.all(solutions.map(s => s.save()))
}

/**
 * 之前的数据里的 Contest model 没有 ranklist 属性，这个函数在现有数据库基础上生成 ranklist
 * TODO: 这个函数暂时没用上
 */
// eslint-disable-next-line
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
  await Promise.all(contests.map(update))
}

async function main () {
  const problems = await Problem.find().exec()
  await Promise.all(problems.map(helper))
}

main()
  .then(() => console.log('ok'))
  .catch((err) => console.log(err))
