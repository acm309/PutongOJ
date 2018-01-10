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

  const solutions = await Solution.find({ pid })
  const meta = {
    testcases: []
  }
  const newid = uuid()
  meta.testcases.push({
    uuid: newid
  })
  await Promise.all([
    fse.move(path.resolve(__dirname, `../../data/${pid}/test.in`), path.resolve(__dirname, `../../data/${pid}/${newid}.in`)),
    fse.move(path.resolve(__dirname, `../../data/${pid}/test.out`), path.resolve(__dirname, `../../data/${pid}/${newid}.out`))
  ])
  solutions.forEach((solution) => {
    solution.testcases.push({
      uuid: newid,
      judge: solution.judge,
      time: solution.time,
      memory: solution.memory
    })
  })
  await Promise.all(solutions.map(s => s.save()))
}

async function main () {
  const problems = await Problem.find().exec()
  await Promise.all(problems.map(helper))
}
