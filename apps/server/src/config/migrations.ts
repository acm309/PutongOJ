import { Buffer } from 'node:buffer'
import { randomUUID } from 'node:crypto'
import { md5 } from '@noble/hashes/legacy.js'
import { OAuthProvider } from '@putongoj/shared'
import mongoose from '../config/db'
import Contest from '../models/Contest'
import OAuth from '../models/OAuth'
import Post from '../models/Post'
import User from '../models/User'
import { settingsService } from '../services/settings'
import logger from '../utils/logger'

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
