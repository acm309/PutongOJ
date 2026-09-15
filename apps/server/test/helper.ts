import redis from '../src/config/redis.ts'
import Comment from '../src/models/Comment.ts'
import Contest from '../src/models/Contest.ts'
import Course from '../src/models/Course.ts'
import CourseMember from '../src/models/CourseMember.ts'
import Discussion from '../src/models/Discussion.ts'
import Files from '../src/models/Files.ts'
import Group from '../src/models/Group.ts'
import ID from '../src/models/ID.ts'
import Post from '../src/models/Post.ts'
import Problem from '../src/models/Problem.ts'
import Settings from '../src/models/Settings.ts'
import Solution from '../src/models/Solution.ts'
import Tag from '../src/models/Tag.ts'
import User from '../src/models/User.ts'

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
