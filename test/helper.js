const User = require('../models/User')
const Problem = require('../models/Problem')
const ID = require('../models/ID')

function removeall () {
  return Promise.all([
    User.remove({}).exec(),
    Problem.remove({}).exec(),
    ID.remove({}).exec()
  ])
}

module.exports = {
  removeall
}
