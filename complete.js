require('dotenv-flow').config()

const Solution = require('./models/Solution')
const Problem = require('./models/Problem')
require('./config/db')

async function main () {
  console.log('start')
  const problems = await Problem.find({}).exec()
  const arr = problems.map(async (problem, index) => {
    const submit = await Solution
      .find({ pid: problem.pid })
      .distinct('uid')
      .exec()

    const ac = await Solution
      .find({ pid: problem.pid, judge: 3 })
      .distinct('uid')
      .exec()

    problem.submit = submit.length
    problem.solve = ac.length
    await problem.save()
  })
  await Promise.all(arr)
}

main()
  .then(() => {
    console.log('ok')
  })
  .catch((e) => {
    console.log(e)
  })
