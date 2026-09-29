import { Buffer } from 'node:buffer'
import { randomUUID } from 'node:crypto'
import { md5 } from '@noble/hashes/legacy.js'
import { Contest, ID, mongoose, OAuth, Post, Problem, User } from '@putong-oj/db'
import { OAuthProvider, status as problemStatus } from '@putong-oj/shared'
import { isVerifiableOAuthConnection } from '../services/oauth.ts'
import { settingsService } from '../services/settings.ts'
import { passwordHash } from '../utils/index.ts'
import { createLogger } from '../utils/logger.ts'

const logger = createLogger('server.migrations')

interface MigrationTask {
  key: string
  description: string
  run: () => Promise<void>
}

async function migrateUserStorageQuota () {
  const result = await User.updateMany(
    { storageQuota: { $exists: false } },
    { $set: { storageQuota: 0 } },
  )
  logger.info(`Migration user.storageQuota completed, modified=${result.modifiedCount}`)
}

async function migrateOAuthProviderToLowercase () {
  const mappings: Array<{ from: string, to: OAuthProvider }> = [
    { from: 'CJLU', to: OAuthProvider.CJLU },
    { from: 'Codeforces', to: OAuthProvider.Codeforces },
  ]

  let modifiedTotal = 0
  for (const { from, to } of mappings) {
    const result = await OAuth.updateMany(
      { provider: from as unknown as OAuthProvider },
      { $set: { provider: to } },
      { overwriteImmutable: true },
    )
    modifiedTotal += result.modifiedCount
  }

  logger.info(`Migration OAuth.provider lowercase completed, modified=${modifiedTotal}`)
}

async function migrateNewsToPost () {
  interface LegacyNews {
    _id?: mongoose.Types.ObjectId
    nid?: number
    title?: string
    content?: string
    status?: number
    createdAt?: Date
    updatedAt?: Date
  }

  const newsCollection = mongoose.connection.collection('News')
  const legacyNews = await newsCollection.find({}).toArray() as LegacyNews[]

  function buildLegacyPostSlug (nid: number) {
    const nidBytes = Uint8Array.from(Buffer.from(`news-${nid}`))
    const hex = Buffer.from(md5(nidBytes)).toString('hex')
    return [
      hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20, 32),
    ].join('-')
  }

  const operations = legacyNews
    .filter(item => typeof item.title === 'string' && typeof item.content === 'string')
    .map((item) => {
      const { nid, title, content } = item
      if (!title || !content) {
        return null
      }

      const slug = nid ? buildLegacyPostSlug(nid) : randomUUID()
      const createdAt = item.createdAt ?? new Date()
      const updatedAt = item.updatedAt ?? createdAt
      const isPublished = true
      const isPinned = false
      const isHidden = item.status !== 2

      return { updateOne: {
        filter: { slug },
        update: { $setOnInsert: {
          ...(item._id ? { _id: item._id } : {}),
          slug, title, content, isPublished, isPinned, isHidden, createdAt, updatedAt,
        } },
        upsert: true,
      } }
    })
    .filter((op): op is { updateOne: any } => op !== null)

  if (operations.length === 0) {
    logger.info('Migration News->Post skipped, no valid legacy rows to migrate')
    return
  }

  const result = await Post.bulkWrite(operations, { ordered: false, timestamps: false })
  logger.info(`Migration News->Post completed, inserted=${result.upsertedCount}, matched=${result.matchedCount}`)
}

async function migratePostPublishedAt () {
  const posts = await Post.find({ publishesAt: { $exists: false } }).lean()
  if (posts.length === 0) {
    logger.info('Migration Post.publishesAt skipped, no posts to migrate')
    return
  }

  const operations = posts.map(post => ({
    updateOne: {
      filter: { _id: post._id },
      update: { $set: { publishesAt: post.createdAt } },
    },
  }))

  const result = await Post.bulkWrite(operations, { ordered: false })
  logger.info(`Migration Post.publishesAt completed, modified=${result.modifiedCount}`)
}

async function migrateContestAllowEarlyExit () {
  const result = await Contest.updateMany(
    { allowEarlyExit: { $exists: false } },
    { $set: { allowEarlyExit: false } },
  )
  logger.info(`Migration Contest.allowEarlyExit completed, modified=${result.modifiedCount}`)
}

async function migrateGroupIdToObjectId () {
  interface LegacyGroup {
    _id: mongoose.Types.ObjectId
    gid?: number
  }

  interface LegacyUser {
    _id: mongoose.Types.ObjectId
    gid?: unknown
  }

  const groupCollection = mongoose.connection.collection('Group')
  const userCollection = mongoose.connection.collection('User')

  const legacyGroups = await groupCollection
    .find({ gid: { $exists: true } })
    .toArray() as unknown as LegacyGroup[]
  const groupIdByGid = new Map<number, mongoose.Types.ObjectId>()
  for (const group of legacyGroups) {
    if (typeof group.gid === 'number' && group._id instanceof mongoose.Types.ObjectId) {
      groupIdByGid.set(group.gid, group._id)
    }
  }

  const legacyUsers = await userCollection
    .find({ gid: { $exists: true } })
    .toArray() as unknown as LegacyUser[]
  let skippedCount = 0
  const operations = legacyUsers.map((user) => {
    const legacyGroupIds = Array.isArray(user.gid) ? user.gid : [ user.gid ]
    const groups: mongoose.Types.ObjectId[] = []
    const seen = new Set<string>()

    for (const gid of legacyGroupIds) {
      if (typeof gid !== 'number') {
        skippedCount += 1
        continue
      }

      const groupId = groupIdByGid.get(gid)
      if (!groupId) {
        skippedCount += 1
        continue
      }

      const groupIdHex = groupId.toHexString()
      if (!seen.has(groupIdHex)) {
        seen.add(groupIdHex)
        groups.push(groupId)
      }
    }

    return {
      updateOne: {
        filter: { _id: user._id },
        update: {
          $set: { groups },
          $unset: { gid: '' },
        },
      },
    }
  })

  if (operations.length > 0) {
    await userCollection.bulkWrite(operations, { ordered: false })
  }

  const groupIndexes = await groupCollection.indexes()
  if (groupIndexes.some(index => index.name === 'gid_1')) {
    await groupCollection.dropIndex('gid_1')
  }

  const groupUpdate = await groupCollection.updateMany({}, { $unset: { gid: '' } })

  const userIndexes = await userCollection.indexes()
  if (userIndexes.some(index => index.name === 'gid_1')) {
    await userCollection.dropIndex('gid_1')
  }

  await ID.deleteOne({ name: 'Group' })

  logger.info(
    'Migration Group.gid -> _id completed, '
    + `groups=${groupIdByGid.size}, users=${operations.length}, `
    + `clearedGroups=${groupUpdate.modifiedCount}, skipped=${skippedCount}`,
  )
}

async function migrateTagIdToObjectId () {
  const tagCollection = mongoose.connection.collection('Tag')

  const tagIndexes = await tagCollection.indexes()
  if (tagIndexes.some(index => index.name === 'tagId_1')) {
    await tagCollection.dropIndex('tagId_1')
  }

  const result = await tagCollection.updateMany({}, { $unset: { tagId: '' } })
  await ID.deleteOne({ name: 'Tag' })

  logger.info(`Migration Tag.tagId -> _id completed, cleared=${result.modifiedCount}`)
}

async function migrateCommentIdToObjectId () {
  const commentCollection = mongoose.connection.collection('Comment')

  const commentIndexes = await commentCollection.indexes()
  if (commentIndexes.some(index => index.name === 'commentId_1')) {
    await commentCollection.dropIndex('commentId_1')
  }

  const result = await commentCollection.updateMany({}, { $unset: { commentId: '' } })
  await ID.deleteOne({ name: 'Comment' })

  logger.info(`Migration Comment.commentId -> _id completed, cleared=${result.modifiedCount}`)
}

async function migrateDiscussionIdToObjectId () {
  const discussionCollection = mongoose.connection.collection('Discussion')

  const discussionIndexes = await discussionCollection.indexes()
  if (discussionIndexes.some(index => index.name === 'discussionId_1')) {
    await discussionCollection.dropIndex('discussionId_1')
  }

  const result = await discussionCollection.updateMany({}, { $unset: { discussionId: '' } })
  await ID.deleteOne({ name: 'Discussion' })

  logger.info(`Migration Discussion.discussionId -> _id completed, cleared=${result.modifiedCount}`)
}

async function migrateCourseIdToObjectId () {
  const courseCollection = mongoose.connection.collection('Course')

  const courseIndexes = await courseCollection.indexes()
  if (courseIndexes.some(index => index.name === 'courseId_1')) {
    await courseCollection.dropIndex('courseId_1')
  }

  const result = await courseCollection.updateMany({}, { $unset: { courseId: '' } })
  await ID.deleteOne({ name: 'Course' })

  logger.info(`Migration Course.courseId -> _id completed, cleared=${result.modifiedCount}`)
}

async function migrateSolutionSimilarSolutionRef () {
  interface LegacySolution {
    _id: mongoose.Types.ObjectId
    sid?: number
    sim?: unknown
    sim_s_id?: unknown
  }

  const solutionCollection = mongoose.connection.collection('Solution')
  const solutions = await solutionCollection
    .find({
      $or: [
        { sim: { $exists: true } },
        { sim_s_id: { $exists: true } },
      ],
    })
    .toArray() as unknown as LegacySolution[]

  if (solutions.length === 0) {
    logger.info('Migration Solution.sim_s_id/sim skipped, no solutions to migrate')
    return
  }

  const allSolutions = await solutionCollection
    .find({}, { projection: { _id: 1, sid: 1 } })
    .toArray() as unknown as LegacySolution[]
  const solutionIdBySid = new Map<number, mongoose.Types.ObjectId>()
  for (const solution of allSolutions) {
    if (typeof solution.sid === 'number' && solution._id instanceof mongoose.Types.ObjectId) {
      solutionIdBySid.set(solution.sid, solution._id)
    }
  }

  let missingCount = 0
  const operations = solutions.map((solution) => {
    const similarSid = typeof solution.sim_s_id === 'number' ? solution.sim_s_id : 0
    let similarSolution: mongoose.Types.ObjectId | null = null

    if (similarSid > 0) {
      similarSolution = solutionIdBySid.get(similarSid) ?? null
      if (!similarSolution) {
        missingCount += 1
      }
    }

    return {
      updateOne: {
        filter: { _id: solution._id },
        update: {
          $set: { similarSolution },
          $rename: { sim: 'similarity' },
          $unset: { sim_s_id: '' },
        },
      },
    }
  })

  const result = await solutionCollection.bulkWrite(operations, { ordered: false })
  logger.info(
    'Migration Solution.sim_s_id/sim completed, '
    + `modified=${result.modifiedCount}, missing=${missingCount}, renamedSimilarity=${solutions.length}`,
  )
}

async function migrateSolutionContestRef () {
  interface LegacySolution {
    _id: mongoose.Types.ObjectId
    mid?: unknown
  }

  interface LegacyContest {
    _id: mongoose.Types.ObjectId
    contestId?: unknown
  }

  const solutionCollection = mongoose.connection.collection('Solution')
  const solutions = await solutionCollection
    .find({ mid: { $exists: true } })
    .toArray() as unknown as LegacySolution[]
  const contests = await Contest
    .find({}, { _id: 1, contestId: 1 })
    .lean() as unknown as LegacyContest[]
  const contestIdMap = new Map<number, mongoose.Types.ObjectId>()

  for (const contest of contests) {
    if (typeof contest.contestId === 'number' && contest._id instanceof mongoose.Types.ObjectId) {
      contestIdMap.set(contest.contestId, contest._id)
    }
  }

  let missingCount = 0
  let unassignedCount = 0
  if (solutions.length > 0) {
    const operations = solutions.map((solution) => {
      const mid = typeof solution.mid === 'number' ? solution.mid : -1
      let contest: mongoose.Types.ObjectId | null = null

      if (mid > 0) {
        contest = contestIdMap.get(mid) ?? null
        if (!contest) {
          missingCount += 1
        }
      } else {
        unassignedCount += 1
      }

      return {
        updateOne: {
          filter: { _id: solution._id },
          update: {
            $set: { contest },
            $unset: { mid: '' },
          },
        },
      }
    })

    const result = await solutionCollection.bulkWrite(operations, { ordered: false })
    logger.info(
      'Migration Solution.mid -> contest completed, '
      + `modified=${result.modifiedCount}, missing=${missingCount}, unassigned=${unassignedCount}`,
    )
  } else {
    logger.info('Migration Solution.mid -> contest skipped, no solutions to migrate')
  }

  const indexNames = new Set((await solutionCollection.indexes()).map(index => index.name))
  for (const indexName of [ 'mid_1', 'mid_1_createdAt_-1' ]) {
    if (indexNames.has(indexName)) {
      await solutionCollection.dropIndex(indexName)
    }
  }
  await solutionCollection.createIndex({ contest: 1 }, { name: 'contest_1' })
  await solutionCollection.createIndex({ contest: 1, createdAt: -1 }, { name: 'contest_1_createdAt_-1' })
}

async function migrateSolutionUserRef () {
  interface LegacySolution {
    _id: mongoose.Types.ObjectId
    uid?: unknown
    user?: unknown
  }

  interface LegacyUser {
    _id: mongoose.Types.ObjectId
    uid?: unknown
  }

  const solutionCollection = mongoose.connection.collection('Solution')
  const solutions = await solutionCollection
    .find({
      $or: [
        { uid: { $exists: true } },
        { user: { $exists: false } },
      ],
    })
    .toArray() as unknown as LegacySolution[]
  const users = await User
    .find({}, { _id: 1, uid: 1 })
    .lean() as unknown as LegacyUser[]
  const userIdByUid = new Map<string, mongoose.Types.ObjectId>()

  for (const user of users) {
    if (typeof user.uid === 'string' && user._id instanceof mongoose.Types.ObjectId) {
      userIdByUid.set(user.uid, user._id)
    }
  }

  let missingUidCount = 0
  let missingUserCount = 0
  const rows = solutions.map((solution) => {
    const uid = typeof solution.uid === 'string' ? solution.uid : ''
    if (!uid) {
      missingUidCount += 1
      return { _id: solution._id, user: null }
    }

    const user = userIdByUid.get(uid)
    if (!user) {
      missingUserCount += 1
      return { _id: solution._id, user: null }
    }
    return { _id: solution._id, user }
  })

  let ghostUserId: mongoose.Types.ObjectId | null = null
  if (rows.some(row => row.user === null)) {
    const ghost = await User.findOne({ uid: 'ghost' }).select('_id').lean()
    if (ghost?._id instanceof mongoose.Types.ObjectId) {
      ghostUserId = ghost._id
    } else {
      const createdGhost = new User({
        uid: 'ghost',
        nick: 'ghost',
        pwd: passwordHash(randomUUID()),
      })
      await createdGhost.save()
      ghostUserId = createdGhost._id
    }
  }

  if (rows.length > 0) {
    const operations = rows.map(row => ({
      updateOne: {
        filter: { _id: row._id },
        update: {
          $set: { user: row.user ?? ghostUserId },
          $unset: { uid: '' },
        },
      },
    }))

    const result = await solutionCollection.bulkWrite(operations, { ordered: false })
    logger.info(
      'Migration Solution.uid -> user completed, '
      + `modified=${result.modifiedCount}, missingUid=${missingUidCount}, missingUser=${missingUserCount}`,
    )
  } else {
    logger.info('Migration Solution.uid -> user skipped, no solutions to migrate')
  }

  const indexNames = new Set((await solutionCollection.indexes()).map(index => index.name))
  for (const indexName of [ 'uid_1', 'uid_1_createdAt_-1' ]) {
    if (indexNames.has(indexName)) {
      await solutionCollection.dropIndex(indexName)
    }
  }
  await solutionCollection.createIndex({ user: 1 }, { name: 'user_1' })
  await solutionCollection.createIndex({ user: 1, createdAt: -1 }, { name: 'user_1_createdAt_-1' })
}

async function migrateSolutionProblemRef () {
  interface LegacySolution {
    _id: mongoose.Types.ObjectId
    pid?: unknown
  }

  interface LegacyProblem {
    _id: mongoose.Types.ObjectId
    pid?: unknown
  }

  const solutionCollection = mongoose.connection.collection('Solution')
  const solutions = await solutionCollection
    .find({ pid: { $exists: true } })
    .toArray() as unknown as LegacySolution[]
  await Problem.updateMany(
    { deletedAt: { $exists: false } },
    { $set: { deletedAt: null } },
  )

  if (solutions.length > 0) {
    const pidBySolution = new Map<mongoose.Types.ObjectId, number>()
    const solutionPids = new Set<number>()
    let fallbackPidCount = 0

    for (const solution of solutions) {
      const pid = typeof solution.pid === 'number'
        ? solution.pid
        : Number(solution.pid)
      if (!Number.isInteger(pid)) {
        fallbackPidCount += 1
        pidBySolution.set(solution._id, -1)
        solutionPids.add(-1)
      } else {
        pidBySolution.set(solution._id, pid)
        solutionPids.add(pid)
      }
    }

    const problems = await Problem
      .find({ pid: { $in: [ ...solutionPids ] } }, { _id: 1, pid: 1 })
      .lean() as unknown as LegacyProblem[]
    const problemIdByPid = new Map<number, mongoose.Types.ObjectId>()

    for (const problem of problems) {
      if (typeof problem.pid === 'number' && problem._id instanceof mongoose.Types.ObjectId) {
        problemIdByPid.set(problem.pid, problem._id)
      }
    }

    const missingPids = [ ...solutionPids ].filter(pid => !problemIdByPid.has(pid))
    if (missingPids.length > 0) {
      const deletedAt = new Date()
      const createdProblems = await Problem.insertMany(
        missingPids.map(pid => ({
          pid,
          title: `Deleted problem ${pid}`,
          status: problemStatus.Reserve,
          owner: null,
          tags: [],
          deletedAt,
        })),
      )
      for (const problem of createdProblems) {
        problemIdByPid.set(problem.pid, problem._id)
      }
    }

    const maxPid = Math.max(...solutionPids)
    if (maxPid > 0) {
      await ID.updateOne(
        { name: 'Problem' },
        { $max: { id: maxPid } },
        { upsert: true },
      )
    }

    const operations = solutions.map((solution) => {
      const pid = pidBySolution.get(solution._id)!
      const problem = problemIdByPid.get(pid)
      if (!problem) {
        throw new Error(`Migration Solution.pid -> problem blocked, Problem<${pid}> was not resolved`)
      }

      return {
        updateOne: {
          filter: { _id: solution._id },
          update: {
            $set: { problem },
            $unset: { pid: '' },
          },
        },
      }
    })

    const result = await solutionCollection.bulkWrite(operations, { ordered: false })
    logger.info(
      'Migration Solution.pid -> problem completed, '
      + `modified=${result.modifiedCount}, tombstones=${missingPids.length}, fallback=${fallbackPidCount}`,
    )
  } else {
    logger.info('Migration Solution.pid -> problem skipped, no solutions to migrate')
  }

  const indexNames = new Set((await solutionCollection.indexes()).map(index => index.name))
  for (const indexName of [ 'pid_1', 'pid_1_createdAt_-1' ]) {
    if (indexNames.has(indexName)) {
      await solutionCollection.dropIndex(indexName)
    }
  }
  await solutionCollection.createIndex({ problem: 1 }, { name: 'problem_1' })
  await solutionCollection.createIndex({ problem: 1, createdAt: -1 }, { name: 'problem_1_createdAt_-1' })
}

async function migrateUserVerifiedBackfill () {
  const users = await User.find({ verified: { $exists: false } })
    .select({ _id: 1, uid: 1 })
    .lean()

  if (users.length === 0) {
    logger.info('Migration user.verified backfill skipped, no users to migrate')
    return
  }

  const connections = await OAuth.find({
    provider: OAuthProvider.CJLU,
    user: { $in: users.map(user => user._id) },
  }).lean()
  const connectionByUserId = new Map(
    connections.map(connection => [ connection.user.toString(), connection ]),
  )
  const operations = users.map((user) => {
    const connection = connectionByUserId.get(user._id.toString())
    const verified = connection !== undefined
      && isVerifiableOAuthConnection(user, connection)

    return {
      updateOne: {
        filter: { _id: user._id, verified: { $exists: false } },
        update: { $set: { verified } },
      },
    }
  })
  const result = await User.bulkWrite(operations, { ordered: false })

  logger.info(`Migration user.verified backfill completed, modified=${result.modifiedCount}`)
}

const migrationTasks: MigrationTask[] = [
  {
    key: '20260320-user-storage-quota-default',
    description: 'Backfill missing user.storageQuota with 0',
    run: migrateUserStorageQuota,
  },
  {
    key: '20260406-oauth-provider-lowercase',
    description: 'Normalize OAuth.provider from legacy mixed-case values to lowercase enum values',
    run: migrateOAuthProviderToLowercase,
  },
  {
    key: '20260411-news-to-post',
    description: 'Migrate legacy News collection to Post collection',
    run: migrateNewsToPost,
  },
  {
    key: '20260418-post-published-at-default',
    description: 'Backfill missing Post.publishesAt with createdAt value',
    run: migratePostPublishedAt,
  },
  {
    key: '20260612-contest-allow-early-exit',
    description: 'Backfill missing Contest.allowEarlyExit with false',
    run: migrateContestAllowEarlyExit,
  },
  {
    key: '20260922-group-object-id',
    description: 'Replace Group.gid and User.gid[] with ObjectId-based group references',
    run: migrateGroupIdToObjectId,
  },
  {
    key: '20260927-user-verified-backfill',
    description: 'Backfill pre-existing users as verified only when their CJLU SSO providerId matches their uid',
    run: migrateUserVerifiedBackfill,
  },
  {
    key: '20260929-tag-object-id',
    description: 'Remove legacy Tag.tagId counter and use _id as the tag identifier',
    run: migrateTagIdToObjectId,
  },
  {
    key: '20260929-comment-object-id',
    description: 'Remove legacy Comment.commentId counter and use _id as the comment identifier',
    run: migrateCommentIdToObjectId,
  },
  {
    key: '20260929-discussion-object-id',
    description: 'Remove legacy Discussion.discussionId counter and use _id as the discussion identifier',
    run: migrateDiscussionIdToObjectId,
  },
  {
    key: '20260929-course-object-id',
    description: 'Remove legacy Course.courseId counter and use _id as the course identifier',
    run: migrateCourseIdToObjectId,
  },
  {
    key: '20260929-solution-similar-solution-ref',
    description: 'Replace Solution.sim_s_id with ObjectId similarSolution reference and rename Solution.sim to similarity',
    run: migrateSolutionSimilarSolutionRef,
  },
  {
    key: '20260929-solution-contest-ref',
    description: 'Replace Solution.mid with ObjectId contest reference',
    run: migrateSolutionContestRef,
  },
  {
    key: '20260929-solution-user-ref',
    description: 'Replace Solution.uid with ObjectId user reference',
    run: migrateSolutionUserRef,
  },
  {
    key: '20260929-solution-problem-ref',
    description: 'Replace Solution.pid with ObjectId problem reference and tombstone missing problems',
    run: migrateSolutionProblemRef,
  },
]

export async function runMigrations () {
  const applied = await settingsService.getMigrationsApplied()
  const pending = migrationTasks.filter(task => !applied.has(task.key))

  if (pending.length === 0) {
    logger.info('No pending DB migrations')
    return
  }

  logger.info(`Running ${pending.length} DB migration(s)`)
  for (const task of pending) {
    logger.info(`Running migration <${task.key}>: ${task.description}`)
    await task.run()
    applied.add(task.key)
    await settingsService.setMigrationsApplied(applied)
    logger.info(`Migration <${task.key}> completed`)
  }

  logger.info('DB migrations completed')
}
