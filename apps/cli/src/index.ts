#!/usr/bin/env node
import process from 'node:process'
import { MongoClient } from 'mongodb'
import dotenvFlow from 'dotenv-flow'
import { createDatabaseClient } from '@putongoj/db'

dotenvFlow.config()

type Command = 'check-connections' | 'inventory' | 'migrate'

function usage (): never {
  console.error(`Usage:
  pnpm --filter @putongoj/cli start -- check-connections
  pnpm --filter @putongoj/cli start -- inventory
  pnpm --filter @putongoj/cli start -- migrate --dry-run

Commands:
  check-connections  Verify source MongoDB and target PostgreSQL connectivity.
  inventory          Report legacy collection counts and field/value shapes
                     needed to finalize migration mapping rules.
  migrate            Run the MongoDB to PostgreSQL migration (currently requires
                     completed domain migrators). Use --dry-run while developing.
`)
  process.exit(1)
}

function requiredEnvironment (name: string): string {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

async function checkConnections () {
  const mongoUrl = requiredEnvironment('PTOJ_MONGODB_URL')
  const databaseUrl = requiredEnvironment('DATABASE_URL')
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

async function migrate (dryRun: boolean) {
  if (!dryRun) {
    throw new Error(
      'MongoDB-to-PostgreSQL migrators have not been implemented yet. '
      + 'Use --dry-run only until the source-to-target mapping review is complete.',
    )
  }

  console.log([
    'Dry-run migration plan:',
    '1. Verify MongoDB and PostgreSQL connectivity.',
    '2. Read and validate legacy collections without changing PostgreSQL.',
    '3. Report source collection counts and referential-integrity findings.',
    '4. Execute dependency-ordered migrators after their mapping contracts are approved.',
  ].join('\n'))
  await checkConnections()
}

async function inventory () {
  const mongoUrl = requiredEnvironment('PTOJ_MONGODB_URL')
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

    const [ groupList, userGroups, submissionStatuses, allowedLanguageShapes ] = await Promise.all([
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
      },
    }, null, 2))
  }
  finally {
    await mongo.close()
  }
}

async function main () {
  const [ command, ...argumentsList ] = process.argv.slice(2) as [Command | undefined, ...string[]]
  if (!command || ![ 'check-connections', 'inventory', 'migrate' ].includes(command)) {
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

  await migrate(argumentsList.includes('--dry-run'))
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
