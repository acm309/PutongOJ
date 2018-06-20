require('../config/db')
const User = require('../models/User')
const Problem = require('../models/Problem')
const Group = require('../models/Group')
const ID = require('../models/ID')
const News = require('../models/News')

async function main () {
  await Promise.all([
    User.remove({}).exec(),
    Problem.remove({}).exec(),
    Group.remove({}).exec(),
    ID.remove({}).exec(),
    News.remove({}).exec()
  ])
}

main()
  .then(() => {
    process.exit(0)
  })
