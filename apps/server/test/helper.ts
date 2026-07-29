import redis from '../src/config/redis'
import Comment from '../src/models/Comment'
import Contest from '../src/models/Contest'
import Course from '../src/models/Course'
import CourseMember from '../src/models/CourseMember'
import Discussion from '../src/models/Discussion'
import Files from '../src/models/Files'
import Group from '../src/models/Group'
import ID from '../src/models/ID'
import Post from '../src/models/Post'
import Problem from '../src/models/Problem'
import Settings from '../src/models/Settings'
import Solution from '../src/models/Solution'
import Tag from '../src/models/Tag'
import User from '../src/models/User'

export async function removeall () {
  await Promise.all([
    Comment.deleteMany({}),
    Contest.deleteMany({}),
    Course.deleteMany({}),
    CourseMember.deleteMany({}),
    Discussion.deleteMany({}),
    Files.deleteMany({}),
    Group.deleteMany({}),
    ID.deleteMany({}),
    Post.deleteMany({}),
    Problem.deleteMany({}),
    Settings.deleteMany({}),
    Solution.deleteMany({}),
    Tag.deleteMany({}),
    User.deleteMany({}),
    redis.flushdb(),
  ])
}
