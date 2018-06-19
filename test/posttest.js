require('../config/db')
const User = require('../models/User')
const Problem = require('../models/Problem')
const Group = require('../models/Group')

async function main () {
  await Promise.all([
    User.remove({}).exec(),
    Problem.remove({}).exec(),
    Group.remove({}).exec()
  ])
}

main()
  .then(() => {
    process.exit(0)
  })
