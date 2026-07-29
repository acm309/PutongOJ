import type { PrismaClient } from '@putongoj/db'
import {
  ProblemJudgeType,
  ProblemVisibility,
  TagColor,
  UserPrivilege,
} from '@putongoj/db'
import type { Db, ObjectId } from 'mongodb'

type LegacyUser = {
  _id: ObjectId
  uid: string
  pwd: string
  privilege?: number
  storageQuota?: number
  nick?: string
  avatar?: string
  motto?: string
  mail?: string
  school?: string
  lastRequestId?: string
  lastVisitedAt?: Date
  createdAt?: Date
  updatedAt?: Date
}

type LegacyGroup = {
  gid: number
  title: string
  createdAt?: Date
  updatedAt?: Date
}

type LegacyTag = {
  _id: ObjectId
  tagId: number
  name: string
  color?: string
  createdAt?: Date
  updatedAt?: Date
}

type LegacyProblem = {
  pid: number
  title: string
  time?: number
  memory?: number
  description?: string
  input?: string
  output?: string
  in?: string
  out?: string
  hint?: string
  status?: number
  type?: number
  code?: string
  tags?: ObjectId[]
  owner?: ObjectId | null
  createdAt?: Date
  updatedAt?: Date
}

export type BaseMigrationReport = {
  users: number
  groups: number
  groupMembers: number
  tags: number
  problems: number
  problemTags: number
}

const userPrivileges: Record<number, UserPrivilege> = {
  0: UserPrivilege.BANNED,
  1: UserPrivilege.USER,
  2: UserPrivilege.ADMIN,
  3: UserPrivilege.ROOT,
}

const problemVisibilities: Record<number, ProblemVisibility> = {
  0: ProblemVisibility.RESERVED,
  2: ProblemVisibility.AVAILABLE,
}

const problemJudgeTypes: Record<number, ProblemJudgeType> = {
  1: ProblemJudgeType.TRADITIONAL,
  2: ProblemJudgeType.INTERACTION,
  3: ProblemJudgeType.SPECIAL_JUDGE,
}

const tagColors: Record<string, TagColor> = {
  default: TagColor.DEFAULT,
  purple: TagColor.PURPLE,
  geekblue: TagColor.GEEKBLUE,
  blue: TagColor.BLUE,
  cyan: TagColor.CYAN,
  green: TagColor.GREEN,
  lime: TagColor.LIME,
  // Legacy backups may still contain the removed gold color. The current
  // product representation normalizes it to yellow rather than preserving
  // another target enum value.
  gold: TagColor.YELLOW,
  yellow: TagColor.YELLOW,
  orange: TagColor.ORANGE,
  red: TagColor.RED,
}

function dateOrNow (value: Date | undefined): Date {
  return value ?? new Date()
}

function postgresText (value: string | undefined): string {
  return (value ?? '').replaceAll('\0', '')
}

function requiredEnum<T> (
  mapping: Record<number, T>,
  value: number | undefined,
  field: string,
): T {
  const result = value === undefined ? undefined : mapping[value]
  if (result === undefined) {
    throw new Error(`Unsupported ${field} value: ${String(value)}`)
  }
  return result
}

function requiredTagColor (value: string | undefined): TagColor {
  const result = tagColors[value ?? 'default']
  if (result === undefined) {
    throw new Error(`Unsupported Tag.color value: ${String(value)}`)
  }
  return result
}

async function inBatches<T> (
  values: T[],
  size: number,
  run: (batch: T[]) => Promise<void>,
) {
  for (let offset = 0; offset < values.length; offset += size) {
    await run(values.slice(offset, offset + size))
  }
}

/**
 * The target database must be intentionally reset before a full import.
 * This command is only exposed behind the CLI's --reset-target --confirm
 * gate; it is never run as part of a normal server start.
 */
export async function resetTargetDatabase (database: PrismaClient) {
  await database.$executeRawUnsafe(`
    TRUNCATE TABLE
      "SubmissionTestcaseResult",
      "Submission",
      "Comment",
      "Discussion",
      "ContestParticipation",
      "ContestProblem",
      "ContestIpWhitelist",
      "ContestAllowedGroup",
      "ContestAllowedUser",
      "Contest",
      "CourseProblem",
      "CourseMember",
      "Course",
      "ProblemTag",
      "Problem",
      "Tag",
      "GroupMember",
      "Group",
      "OAuthConnection",
      "File",
      "Post",
      "Setting",
      "User"
    RESTART IDENTITY CASCADE
  `)
}

/**
 * Imported legacy identifiers are inserted explicitly. PostgreSQL sequences do
 * not advance automatically in that case, so align them before later runtime
 * inserts are allowed to use generated IDs.
 */
export async function synchronizeTargetSequences (database: PrismaClient) {
  for (const table of [
    'User',
    'Group',
    'Tag',
    'Problem',
    'Course',
    'Contest',
    'Discussion',
    'Comment',
    'Submission',
    'Post',
  ]) {
    await database.$executeRawUnsafe(`
      SELECT setval(
        pg_get_serial_sequence('"${table}"', 'id'),
        COALESCE((SELECT MAX("id") FROM "${table}"), 1),
        (SELECT COUNT(*) > 0 FROM "${table}")
      )
    `)
  }
}

export async function migrateBaseEntities (
  source: Db,
  target: PrismaClient,
): Promise<BaseMigrationReport> {
  const [ users, groups, tags, problems ] = await Promise.all([
    source.collection<LegacyUser>('User').find({}).toArray(),
    source.collection<LegacyGroup>('Group').find({}).toArray(),
    source.collection<LegacyTag>('Tag').find({}).toArray(),
    source.collection<LegacyProblem>('Problem').find({}).toArray(),
  ])

  await inBatches(users, 1_000, async batch => {
    await target.user.createMany({
      data: batch.map(user => ({
        username: postgresText(user.uid),
        passwordHash: postgresText(user.pwd),
        privilege: requiredEnum(userPrivileges, user.privilege ?? 1, 'User.privilege'),
        storageQuota: BigInt(user.storageQuota ?? 0),
        nickname: postgresText(user.nick),
        avatarUrl: postgresText(user.avatar),
        motto: postgresText(user.motto),
        email: postgresText(user.mail),
        school: postgresText(user.school),
        lastRequestId: user.lastRequestId === undefined ? undefined : postgresText(user.lastRequestId),
        lastVisitedAt: user.lastVisitedAt,
        createdAt: dateOrNow(user.createdAt),
        updatedAt: dateOrNow(user.updatedAt),
      })),
      skipDuplicates: true,
    })
  })

  const targetUsers = await target.user.findMany({
    select: { id: true, username: true },
  })
  const userIdByUsername = new Map(targetUsers.map(user => [ user.username, user.id ]))
  const userIdByMongoId = new Map(users.map((user) => {
    const userId = userIdByUsername.get(user.uid)
    if (userId === undefined) {
      throw new Error(`Target User missing after import: ${user.uid}`)
    }
    return [ user._id.toHexString(), userId ]
  }))

  await inBatches(groups, 1_000, async batch => {
    await target.group.createMany({
      data: batch.map(group => ({
        id: group.gid,
        name: postgresText(group.title),
        createdAt: dateOrNow(group.createdAt),
        updatedAt: dateOrNow(group.updatedAt),
      })),
      skipDuplicates: true,
    })
  })

  await inBatches(tags, 1_000, async batch => {
    await target.tag.createMany({
      data: batch.map(tag => ({
        id: tag.tagId,
        name: postgresText(tag.name),
        color: requiredTagColor(tag.color),
        createdAt: dateOrNow(tag.createdAt),
        updatedAt: dateOrNow(tag.updatedAt),
      })),
      skipDuplicates: true,
    })
  })

  await inBatches(problems, 1_000, async batch => {
    await target.problem.createMany({
      data: batch.map(problem => ({
        id: problem.pid,
        title: postgresText(problem.title),
        timeLimitMs: problem.time ?? 1_000,
        memoryLimitKb: problem.memory ?? 32_768,
        description: postgresText(problem.description),
        inputFormat: postgresText(problem.input),
        outputFormat: postgresText(problem.output),
        sampleInput: postgresText(problem.in),
        sampleOutput: postgresText(problem.out),
        hint: postgresText(problem.hint),
        visibility: requiredEnum(problemVisibilities, problem.status ?? 0, 'Problem.status'),
        judgeType: requiredEnum(problemJudgeTypes, problem.type ?? 1, 'Problem.type'),
        judgeCode: postgresText(problem.code),
        ownerId: problem.owner
          ? userIdByMongoId.get(problem.owner.toHexString())
          : null,
        createdAt: dateOrNow(problem.createdAt),
        updatedAt: dateOrNow(problem.updatedAt),
      })),
      skipDuplicates: true,
    })
  })

  const groupIds = new Set(groups.map(group => group.gid))
  const groupMembers = users.flatMap((user) => {
    const userId = userIdByMongoId.get(user._id.toHexString())
    if (userId === undefined) {
      throw new Error(`Target User missing for group membership: ${user.uid}`)
    }
    return (user as LegacyUser & { gid?: number[] }).gid?.map(groupId => {
      if (!groupIds.has(groupId)) {
        throw new Error(`Unknown Group.gid ${groupId} on User ${user.uid}`)
      }
      return { groupId, userId }
    }) ?? []
  })
  await inBatches(groupMembers, 5_000, async batch => {
    await target.groupMember.createMany({ data: batch, skipDuplicates: true })
  })

  const tagIdByMongoId = new Map(tags.map(tag => [ tag._id.toHexString(), tag.tagId ]))
  const problemTags = problems.flatMap(problem => (problem.tags ?? []).map(tag => {
    const tagId = tagIdByMongoId.get(tag.toHexString())
    if (tagId === undefined) {
      throw new Error(`Unknown Tag reference on Problem ${problem.pid}`)
    }
    return { problemId: problem.pid, tagId }
  }))
  await inBatches(problemTags, 5_000, async batch => {
    await target.problemTag.createMany({ data: batch, skipDuplicates: true })
  })

  await synchronizeTargetSequences(target)

  return {
    users: users.length,
    groups: groups.length,
    groupMembers: groupMembers.length,
    tags: tags.length,
    problems: problems.length,
    problemTags: problemTags.length,
  }
}
