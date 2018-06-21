const User = require('../models/User')
const Problem = require('../models/Problem')
const ID = require('../models/ID')
const Solution = require('../models/Solution')
const Group = require('../models/Group')
const News = require('../models/News')

function removeall () {
  return Promise.all([
    User.remove({}).exec(),
    Problem.remove({}).exec(),
    ID.remove({}).exec(),
    Solution.remove({}).exec(),
    Group.remove({}).exec(),
    News.remove({}).exec()
  ])
}

module.exports = {
  removeall
}
