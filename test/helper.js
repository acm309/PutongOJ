const User = require('../models/User')
const Problem = require('../models/Problem')
const ID = require('../models/ID')
const Solution = require('../models/Solution')
const Group = require('../models/Group')
const News = require('../models/News')
const Tag = require('../models/Tag')
const Discuss = require('../models/Discuss')

function removeall () {
  return Promise.all([
    User.remove({}).exec(),
    Problem.remove({}).exec(),
    ID.remove({}).exec(),
    Solution.remove({}).exec(),
    Group.remove({}).exec(),
    News.remove({}).exec(),
    Tag.remove({}).exec(),
    Discuss.remove({}).exec()
  ])
}

module.exports = {
  removeall
}
