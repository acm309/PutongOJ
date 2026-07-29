#!/usr/bin/env node
import process from 'node:process'
import { MongoClient } from 'mongodb'
import dotenvFlow from 'dotenv-flow'
import { createDatabaseClient } from '@putongoj/db'
import { auditMongoSource } from './audit.js'
import { migrateBaseEntities, resetTargetDatabase } from './migrate/base.js'
import { migrateAllEntities } from './migrate/full.js'
import { verifyPostgresTarget } from './verify.js'

dotenvFlow.config({ silent: true })

type Command = 'audit' | 'check-connections' | 'inventory' | 'migrate-base' | 'migrate' | 'verify-target'

function usage (): never {
  console.error(`Usage:
  pnpm --filter @putongoj/cli start -- check-connections
  pnpm --filter @putongoj/cli start -- inventory
  pnpm --filter @putongoj/cli start -- audit
  pnpm --filter @putongoj/cli start -- verify-target
  pnpm --filter @putongoj/cli start -- migrate-base --reset-target --confirm
  pnpm --filter @putongoj/cli start -- migrate --reset-target --confirm

Commands:
  check-connections  Verify source MongoDB and target PostgreSQL connectivity.
  inventory          Report legacy collection counts and field/value shapes
                     needed to finalize migration mapping rules.
  audit              Run read-only referential-integrity, duplicate, and enum
                     checks against the MongoDB source dataset.
  verify-target      Report PostgreSQL row counts and critical referential
                     integrity checks after an import.
  migrate-base       Import users, groups, tags, problems, and their first
                     relationship tables into an intentionally reset target.
  migrate            Run the complete MongoDB to PostgreSQL import into an
                     intentionally reset target database.
`)
  process.exit(1)
}

function environment (name: string, defaultValue?: string): string {
  const value = process.env[name]?.trim()
  if (!value && defaultValue === undefined) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value || defaultValue!
}

async function checkConnections () {
  const mongoUrl = environment('PTOJ_MONGODB_URL', 'mongodb://localhost:27017/oj')
  const databaseUrl = environment('DATABASE_URL')
  const mongo = new MongoClient(mongoUrl)
  const postgres = createDatabaseClient(databaseUrl)

  try {
    await mongo.connect()
    await mongo.db().command({ ping: 1 })
    await postgres.$queryRaw`SELECT 1`
    console.log('MongoDB and PostgreSQL connections are available.')
  }
  finally {
    await Promise.allSettled([ mongo.close(), postgres.$disconnect() ])
  }
}

async function migrate (argumentsList: string[]) {
  if (!argumentsList.includes('--reset-target') || !argumentsList.includes('--confirm')) {
    throw new Error(
      'migrate requires both --reset-target and --confirm because it truncates target tables.',
    )
  }

  const mongoUrl = environment('PTOJ_MONGODB_URL', 'mongodb://localhost:27017/oj')
  const databaseUrl = environment('DATABASE_URL')
  const mongo = new MongoClient(mongoUrl)
  const target = createDatabaseClient(databaseUrl)

  try {
    await mongo.connect()
    const auditReport = await auditMongoSource(mongo.db())
    if (auditReport.summary.errorCount > 0) {
      throw new Error(`Source audit failed with ${auditReport.summary.errorCount} error(s).`)
    }

    await resetTargetDatabase(target)
    const report = await migrateAllEntities(mongo.db(), target)
    console.log(JSON.stringify(report, null, 2))
  }
  finally {
    await Promise.allSettled([ mongo.close(), target.$disconnect() ])
  }
}

async function inventory () {
  const mongoUrl = environment('PTOJ_MONGODB_URL', 'mongodb://localhost:27017/oj')
  const mongo = new MongoClient(mongoUrl)

  try {
    await mongo.connect()
    const database = mongo.db()
    const collectionNames = [
      'User',
      'Group',
      'Tag',
      'Problem',
      'Course',
      'CourseMember',
      'CourseProblem',
      'Contest',
      'ContestParticipation',
      'Solution',
      'Discussion',
      'Comment',
      'Files',
      'OAuth',
      'Posts',
      'Settings',
      'ids',
    ]

    const reports = await Promise.all(collectionNames.map(async (name) => {
      const collection = database.collection(name)
      const [ count, sample ] = await Promise.all([
        collection.countDocuments(),
        collection.findOne(),
      ])
      return {
        collection: name,
        count,
        sampleKeys: sample ? Object.keys(sample).sort() : [],
      }
    }))

    const [
      groupList,
      userGroups,
      submissionStatuses,
      allowedLanguageShapes,
      courses,
      tagColors,
      contestOptions,
      submissionLanguages,
      submissionTestcases,
    ] = await Promise.all([
      database.collection('Group').aggregate([
        { $project: {
          hasLegacyList: { $gt: [ { $size: { $ifNull: [ '$list', [] ] } }, 0 ] },
        } },
        { $group: {
          _id: null,
          groupsWithLegacyList: { $sum: { $cond: [ '$hasLegacyList', 1, 0 ] } },
        } },
      ]).toArray(),
      database.collection('User').aggregate([
        { $project: {
          groupCount: { $size: { $ifNull: [ '$gid', [] ] } },
        } },
        { $group: {
          _id: null,
          usersWithGroups: { $sum: { $cond: [ { $gt: [ '$groupCount', 0 ] }, 1, 0 ] } },
        } },
      ]).toArray(),
      database.collection('Solution').aggregate([
        { $group: {
          _id: null,
          legacyStatusValues: { $addToSet: '$status' },
          judgeValues: { $addToSet: '$judge' },
        } },
      ]).toArray(),
      database.collection('Contest').aggregate([
        { $group: {
          _id: null,
          nullAllowedLanguages: {
            $sum: { $cond: [ { $eq: [ '$allowedLanguages', null ] }, 1, 0 ] },
          },
          emptyAllowedLanguages: {
            $sum: { $cond: [ { $eq: [ '$allowedLanguages', [] ] }, 1, 0 ] },
          },
        } },
      ]).toArray(),
      database.collection('Course').aggregate([
        { $group: {
          _id: null,
          encryptValues: { $addToSet: '$encrypt' },
          missingJoinCode: {
            $sum: { $cond: [ { $eq: [ { $type: '$joinCode' }, 'missing' ] }, 1, 0 ] },
          },
        } },
      ]).toArray(),
      database.collection('Tag').aggregate([
        { $group: { _id: null, colorValues: { $addToSet: '$color' } } },
      ]).toArray(),
      database.collection('Contest').aggregate([
        { $group: {
          _id: null,
          labelingStyleValues: { $addToSet: '$labelingStyle' },
          missingAllowedLanguages: {
            $sum: { $cond: [ { $eq: [ { $type: '$allowedLanguages' }, 'missing' ] }, 1, 0 ] },
          },
          contestsWithIpWhitelist: {
            $sum: {
              $cond: [
                { $gt: [ { $size: { $ifNull: [ '$ipWhitelist', [] ] } }, 0 ] },
                1,
                0,
              ],
            },
          },
        } },
      ]).toArray(),
      database.collection('Solution').aggregate([
        { $group: { _id: null, languageValues: { $addToSet: '$language' } } },
      ]).toArray(),
      database.collection('Solution').aggregate([
        { $group: {
          _id: null,
          withTestcaseResults: {
            $sum: {
              $cond: [
                { $gt: [ { $size: { $ifNull: [ '$testcases', [] ] } }, 0 ] },
                1,
                0,
              ],
            },
          },
        } },
      ]).toArray(),
    ])

    console.log(JSON.stringify({
      collections: reports,
      migrationSignals: {
        groupList: groupList[0] ?? { groupsWithLegacyList: 0 },
        userGroups: userGroups[0] ?? { usersWithGroups: 0 },
        submissions: submissionStatuses[0] ?? {
          legacyStatusValues: [],
          judgeValues: [],
        },
        contests: allowedLanguageShapes[0] ?? {
          nullAllowedLanguages: 0,
          emptyAllowedLanguages: 0,
        },
        courses: courses[0] ?? {
          encryptValues: [],
          missingJoinCode: 0,
        },
        tags: tagColors[0] ?? { colorValues: [] },
        contestOptions: contestOptions[0] ?? {
          labelingStyleValues: [],
          missingAllowedLanguages: 0,
          contestsWithIpWhitelist: 0,
        },
        submissionLanguages: submissionLanguages[0] ?? { languageValues: [] },
        submissionTestcases: submissionTestcases[0] ?? { withTestcaseResults: 0 },
      },
    }, null, 2))
  }
  finally {
    await mongo.close()
  }
}

async function audit () {
  const mongoUrl = environment('PTOJ_MONGODB_URL', 'mongodb://localhost:27017/oj')
  const mongo = new MongoClient(mongoUrl)

  try {
    await mongo.connect()
    const report = await auditMongoSource(mongo.db())
    console.log(JSON.stringify(report, null, 2))
    if (report.summary.errorCount > 0) {
      process.exitCode = 2
    }
  }
  finally {
    await mongo.close()
  }
}

async function migrateBase (argumentsList: string[]) {
  if (!argumentsList.includes('--reset-target') || !argumentsList.includes('--confirm')) {
    throw new Error(
      'migrate-base requires both --reset-target and --confirm because it truncates target tables.',
    )
  }

  const mongoUrl = environment('PTOJ_MONGODB_URL', 'mongodb://localhost:27017/oj')
  const databaseUrl = environment('DATABASE_URL')
  const mongo = new MongoClient(mongoUrl)
  const target = createDatabaseClient(databaseUrl)

  try {
    await mongo.connect()
    const auditReport = await auditMongoSource(mongo.db())
    if (auditReport.summary.errorCount > 0) {
      throw new Error(`Source audit failed with ${auditReport.summary.errorCount} error(s).`)
    }

    await resetTargetDatabase(target)
    const report = await migrateBaseEntities(mongo.db(), target)
    console.log(JSON.stringify(report, null, 2))
  }
  finally {
    await Promise.allSettled([ mongo.close(), target.$disconnect() ])
  }
}

async function verifyTarget () {
  const databaseUrl = environment('DATABASE_URL')
  const target = createDatabaseClient(databaseUrl)

  try {
    const report = await verifyPostgresTarget(target)
    console.log(JSON.stringify(report, null, 2))
    if (Object.values(report.integrity).some(value => value > 0)) {
      process.exitCode = 2
    }
  }
  finally {
    await target.$disconnect()
  }
}

async function main () {
  const [ command, ...argumentsList ] = process.argv.slice(2)
    .filter(argument => argument !== '--') as [Command | undefined, ...string[]]
  if (!command || ![ 'audit', 'check-connections', 'inventory', 'migrate-base', 'migrate', 'verify-target' ].includes(command)) {
    usage()
  }

  if (command === 'check-connections') {
    await checkConnections()
    return
  }

  if (command === 'inventory') {
    await inventory()
    return
  }

  if (command === 'audit') {
    await audit()
    return
  }

  if (command === 'migrate-base') {
    await migrateBase(argumentsList)
    return
  }

  if (command === 'verify-target') {
    await verifyTarget()
    return
  }

  await migrate(argumentsList)
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
