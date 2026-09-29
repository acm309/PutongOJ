import { Buffer } from 'node:buffer'
import { randomUUID } from 'node:crypto'
import { md5 } from '@noble/hashes/legacy.js'
import { Contest, ID, mongoose, OAuth, Post, User } from '@putong-oj/db'
import { OAuthProvider } from '@putong-oj/shared'
import { isVerifiableOAuthConnection } from '../services/oauth.ts'
import { settingsService } from '../services/settings.ts'
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
