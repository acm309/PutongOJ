const Contest = require('../models/Contest')
const Discuss = require('../models/Discuss')
const Group = require('../models/Group')
const ID = require('../models/ID')
const News = require('../models/News')
const Problem = require('../models/Problem')
const Solution = require('../models/Solution')
const Tag = require('../models/Tag')
const User = require('../models/User')

function removeall () {
  return Promise.all([
    User.deleteMany({}).exec(),
    Problem.deleteMany({}).exec(),
    ID.deleteMany({}).exec(),
    Solution.deleteMany({}).exec(),
    Group.deleteMany({}).exec(),
    News.deleteMany({}).exec(),
    Tag.deleteMany({}).exec(),
    Discuss.deleteMany({}).exec(),
    Contest.deleteMany({}).exec(),
  ])
}

module.exports = {
  removeall,
}
