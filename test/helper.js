const User = require('../models/User')
const Problem = require('../models/Problem')
const ID = require('../models/ID')
const Solution = require('../models/Solution')
const Group = require('../models/Group')
const News = require('../models/News')
const Tag = require('../models/Tag')
const Discuss = require('../models/Discuss')
const Contest = require('../models/Contest')

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
