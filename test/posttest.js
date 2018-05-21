require('../config/db')
const User = require('../models/User')
const Problem = require('../models/Problem')

async function main () {
  await Promise.all([
    User.remove({}).exec(),
    Problem.remove({}).exec()
  ])
}

main()
  .then(() => {
    process.exit(0)
  })
