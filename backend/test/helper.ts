import Contest from '../src/models/Contest'
import Course from '../src/models/Course'
import CourseMember from '../src/models/CourseMember'
import Discuss from '../src/models/Discuss'
import Group from '../src/models/Group'
import ID from '../src/models/ID'
import News from '../src/models/News'
import Problem from '../src/models/Problem'
import Solution from '../src/models/Solution'
import Tag from '../src/models/Tag'
import User from '../src/models/User'

function removeall () {
  return Promise.all([
    Contest.deleteMany({}),
    Course.deleteMany({}),
    CourseMember.deleteMany({}),
    Discuss.deleteMany({}),
    Group.deleteMany({}),
    ID.deleteMany({}),
    News.deleteMany({}),
    Problem.deleteMany({}),
    Solution.deleteMany({}),
    Tag.deleteMany({}),
    User.deleteMany({}),
  ])
}

export { removeall }
