require('../../config/db')
const Solution = require('../../models/Solution')
const Problem = require('../../models/Problem')

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

async function main () {
  const problems = await Problem.find().exec()
  await Promise.all(problems.map(helper))
}

main()
  .then(() => console.log('ok'))
  .catch((err) => console.log(err))
