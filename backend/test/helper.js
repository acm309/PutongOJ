const Contest = require('../src/models/Contest')
const Discuss = require('../src/models/Discuss')
const Group = require('../src/models/Group')
const ID = require('../src/models/ID')
const News = require('../src/models/News')
const Problem = require('../src/models/Problem')
const Solution = require('../src/models/Solution')
const Tag = require('../src/models/Tag')
const User = require('../src/models/User')

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
