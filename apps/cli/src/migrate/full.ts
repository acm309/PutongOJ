import type { PrismaClient } from '@putongoj/db'
import type { Db, ObjectId } from 'mongodb'
import type { StatisticsRebuildReport } from '../stats.js'
import { createHash } from 'node:crypto'
import {
  CourseVisibility,
  DiscussionType,
  JudgeStatus,
  LabelingStyle,
  Language,
  ParticipationStatus,
  Prisma,

} from '@putongoj/db'
import { rebuildStatistics } from '../stats.js'
import { migrateBaseEntities, synchronizeTargetSequences } from './base.js'

interface LegacyCourse {
  _id: ObjectId
  courseId: number
  name: string
  description?: string
  encrypt?: number
  joinCode?: string
  createdAt?: Date
  updatedAt?: Date
}

interface LegacyCourseMember {
  course: ObjectId
  user: ObjectId
  role?: Partial<Record<
    'basic' | 'viewTestcase' | 'viewSolution' | 'manageProblem' | 'manageContest' | 'manageCourse',
    boolean
  >>
  createdAt?: Date
  updatedAt?: Date
}

interface LegacyCourseProblem {
  course: ObjectId
  problem: ObjectId
  sort?: number
  createdAt?: Date
  updatedAt?: Date
}

interface LegacyContest {
  _id: ObjectId
  contestId: number
  title: string
  startsAt: Date
  endsAt: Date
  scoreboardFrozenAt?: Date | null
  scoreboardUnfrozenAt?: Date | null
  isHidden?: boolean
  isLocked?: boolean
  isPublic?: boolean
  password?: string
  allowedUsers?: ObjectId[]
  allowedGroups?: ObjectId[]
  ipWhitelist?: Array<{ cidr: string, comment?: string | null }>
  ipWhitelistEnabled?: boolean
  allowEarlyExit?: boolean
  problems?: ObjectId[]
  allowedLanguages?: number[] | null
  labelingStyle?: number
  course?: ObjectId | null
  createdAt?: Date
  updatedAt?: Date
}

interface LegacyContestParticipation {
  contest: ObjectId
  user: ObjectId
  status: number
  createdAt?: Date
  updatedAt?: Date
}

interface LegacyDiscussion {
  _id: ObjectId
  discussionId: number
  author: ObjectId
  problem?: ObjectId | null
  contest?: ObjectId | null
  type?: number
  pinned?: boolean
  title: string
  createdAt?: Date
  updatedAt?: Date
}

interface LegacyComment {
  commentId: number
  discussion: ObjectId
  author: ObjectId
  content: string
  hidden?: boolean
  createdAt?: Date
  updatedAt?: Date
}

interface LegacyFile {
  storageKey: string
  originalName: string
  sizeBytes: number
  owner: ObjectId
  deletedAt?: Date | null
  deletedBy?: ObjectId | null
  createdAt?: Date
  updatedAt?: Date
}

interface LegacyOAuth {
  user: ObjectId
  provider: string
  providerId: string
  displayName: string
  accessToken: string
  refreshToken?: string | null
  raw?: Prisma.InputJsonValue | null
  createdAt?: Date
  updatedAt?: Date
}

interface LegacyPost {
  slug: string
  title: string
  content?: string
  publishesAt?: Date
  isPublished?: boolean
  isPinned?: boolean
  isHidden?: boolean
  createdAt?: Date
  updatedAt?: Date
}

interface LegacySetting {
  key: string
  value: Prisma.InputJsonValue
  createdAt?: Date
  updatedAt?: Date
}

interface LegacySubmission {
  sid: number
  pid: number
  uid: string
  mid?: number
  course?: ObjectId | null
  code: string
  language: number
  judge?: number
  time?: number
  memory?: number
  error?: string
  sim?: number
  sim_s_id?: number
  testcases?: Array<{
    uuid: string
    judge: number
    time: number
    memory: number
  }>
  create?: number
  createdAt?: Date
  updatedAt?: Date
}

interface PreparedSubmission {
  submission: LegacySubmission
  userId: number
}

export type FullMigrationReport = Awaited<ReturnType<typeof migrateBaseEntities>> & StatisticsRebuildReport & {
  courses: number
  courseMembers: number
  courseProblems: number
  contests: number
  contestAllowedUsers: number
  contestAllowedGroups: number
  contestIpWhitelist: number
  contestProblems: number
  removedDuplicateContestProblems: number
  contestParticipations: number
  discussions: number
  comments: number
  files: number
  oauthConnections: number
  posts: number
  settings: number
  submissions: number
  skippedSubmissions: number
  submissionTestcaseResults: number
}

type RemainingMigrationReport = Omit<
  FullMigrationReport,
  keyof Awaited<ReturnType<typeof migrateBaseEntities>>
  | keyof StatisticsRebuildReport
>

const courseVisibilities: Record<number, CourseVisibility> = {
  1: CourseVisibility.PUBLIC,
  2: CourseVisibility.PRIVATE,
}

const languages: Record<number, Language> = {
  1: Language.C,
  2: Language.CPP_11,
  3: Language.JAVA,
  4: Language.PYTHON,
  5: Language.CPP_17,
  6: Language.PYPY,
}

const judgeStatuses: Record<number, JudgeStatus> = {
  0: JudgeStatus.PENDING,
  1: JudgeStatus.RUNNING_JUDGE,
  2: JudgeStatus.COMPILE_ERROR,
  3: JudgeStatus.ACCEPTED,
  4: JudgeStatus.RUNTIME_ERROR,
  5: JudgeStatus.WRONG_ANSWER,
  6: JudgeStatus.TIME_LIMIT_EXCEEDED,
  7: JudgeStatus.MEMORY_LIMIT_EXCEEDED,
  8: JudgeStatus.OUTPUT_LIMIT_EXCEEDED,
  9: JudgeStatus.PRESENTATION_ERROR,
  10: JudgeStatus.SYSTEM_ERROR,
  11: JudgeStatus.REJUDGE_PENDING,
  12: JudgeStatus.SKIPPED,
}

const discussionTypes: Record<number, DiscussionType> = {
  1: DiscussionType.OPEN_DISCUSSION,
  2: DiscussionType.PUBLIC_ANNOUNCEMENT,
  3: DiscussionType.PRIVATE_CLARIFICATION,
  4: DiscussionType.ARCHIVED_DISCUSSION,
}

const participationStatuses: Record<number, ParticipationStatus> = {
  0: ParticipationStatus.NOT_APPLIED,
  1: ParticipationStatus.PENDING,
  2: ParticipationStatus.REJECTED,
  3: ParticipationStatus.SUSPENDED,
  4: ParticipationStatus.APPROVED,
  5: ParticipationStatus.EARLY_EXIT,
}

const labelingStyles: Record<number, LabelingStyle> = {
  1: LabelingStyle.NUMERIC,
  2: LabelingStyle.ALPHABETIC,
}

function dateOrNow (value: Date | undefined): Date {
  return value ?? new Date()
}

function postgresText (value: string | undefined): string {
  return (value ?? '').replaceAll('\0', '')
}

function archivedUsername (legacyUsername: string): string {
  return `archived-${createHash('sha256').update(legacyUsername).digest('hex').slice(0, 11)}`
}

function submissionDate (submission: LegacySubmission): Date {
  return submission.createdAt
    ?? (submission.create === undefined ? undefined : new Date(submission.create))
    ?? new Date()
}

function mapped<T> (mapping: Record<number, T>, value: number | undefined, field: string): T {
  const result = value === undefined ? undefined : mapping[value]
  if (result === undefined) {
    throw new Error(`Unsupported ${field} value: ${String(value)}`)
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

function mongoMap<T extends { _id: ObjectId }, U> (
  values: T[],
  mapper: (value: T) => U,
): Map<string, U> {
  return new Map(values.map(value => [ value._id.toHexString(), mapper(value) ]))
}

function requiredReference<T> (map: Map<string, T>, source: ObjectId, field: string): T {
  const target = map.get(source.toHexString())
  if (target === undefined) {
    throw new Error(`Missing target reference for ${field}: ${source.toHexString()}`)
  }
  return target
}

function roleValue (
  role: LegacyCourseMember['role'],
  field: 'basic' | 'viewTestcase' | 'viewSolution' | 'manageProblem' | 'manageContest' | 'manageCourse',
) {
  return Boolean(role?.[field])
}

export async function migrateRemainingEntities (
  source: Db,
  target: PrismaClient,
): Promise<RemainingMigrationReport> {
  const [
    sourceUsers,
    sourceGroups,
    sourceProblems,
    courses,
    courseMembers,
    courseProblems,
    contests,
    contestParticipations,
    discussions,
    comments,
    files,
    oauthConnections,
    posts,
    settings,
  ] = await Promise.all([
    source.collection<{ _id: ObjectId, uid: string }>('User').find({}, { projection: { _id: 1, uid: 1 } }).toArray(),
    source.collection<{ _id: ObjectId, gid: number }>('Group').find({}, { projection: { _id: 1, gid: 1 } }).toArray(),
    source.collection<{ _id: ObjectId, pid: number }>('Problem').find({}, { projection: { _id: 1, pid: 1 } }).toArray(),
    source.collection<LegacyCourse>('Course').find({}).toArray(),
    source.collection<LegacyCourseMember>('CourseMember').find({}).toArray(),
    source.collection<LegacyCourseProblem>('CourseProblem').find({}).toArray(),
    source.collection<LegacyContest>('Contest').find({}).toArray(),
    source.collection<LegacyContestParticipation>('ContestParticipation').find({}).toArray(),
    source.collection<LegacyDiscussion>('Discussion').find({}).toArray(),
    source.collection<LegacyComment>('Comment').find({}).toArray(),
    source.collection<LegacyFile>('Files').find({}).toArray(),
    source.collection<LegacyOAuth>('OAuth').find({}).toArray(),
    source.collection<LegacyPost>('Posts').find({}).toArray(),
    source.collection<LegacySetting>('Settings').find({}).toArray(),
  ])

  const targetUsers = await target.user.findMany({ select: { id: true, username: true } })
  const targetUserIdByUsername = new Map(targetUsers.map(user => [ user.username, user.id ]))
  const targetContestIds = new Set(
    (await target.contest.findMany({ select: { id: true } })).map(contest => contest.id),
  )
  const userIdByMongoId = new Map(sourceUsers.map((user) => {
    const id = targetUserIdByUsername.get(user.uid)
    if (id === undefined) {
      throw new Error(`Missing target User ${user.uid}`)
    }
    return [ user._id.toHexString(), id ]
  }))
  const groupIdByMongoId = mongoMap(sourceGroups, group => group.gid)
  const problemIdByMongoId = mongoMap(sourceProblems, problem => problem.pid)

  await inBatches(courses, 1_000, async (batch) => {
    await target.course.createMany({
      data: batch.map(course => ({
        id: course.courseId,
        name: course.name,
        description: course.description ?? '',
        visibility: mapped(courseVisibilities, course.encrypt ?? 1, 'Course.encrypt'),
        joinCode: course.joinCode ?? '',
        createdAt: dateOrNow(course.createdAt),
        updatedAt: dateOrNow(course.updatedAt),
      })),
      skipDuplicates: true,
    })
  })
  const courseIdByMongoId = mongoMap(courses, course => course.courseId)

  const courseMemberRows = courseMembers.map(member => ({
    courseId: requiredReference(courseIdByMongoId, member.course, 'CourseMember.course'),
    userId: requiredReference(userIdByMongoId, member.user, 'CourseMember.user'),
    canAccess: roleValue(member.role, 'basic'),
    canViewTestcases: roleValue(member.role, 'viewTestcase'),
    canViewSubmissions: roleValue(member.role, 'viewSolution'),
    canManageProblems: roleValue(member.role, 'manageProblem'),
    canManageContests: roleValue(member.role, 'manageContest'),
    canManageCourse: roleValue(member.role, 'manageCourse'),
    createdAt: dateOrNow(member.createdAt),
    updatedAt: dateOrNow(member.updatedAt),
  }))
  await inBatches(courseMemberRows, 5_000, async (batch) => {
    await target.courseMember.createMany({ data: batch, skipDuplicates: true })
  })

  const courseProblemRows = courseProblems.map(courseProblem => ({
    courseId: requiredReference(courseIdByMongoId, courseProblem.course, 'CourseProblem.course'),
    problemId: requiredReference(problemIdByMongoId, courseProblem.problem, 'CourseProblem.problem'),
    position: courseProblem.sort ?? 0,
    createdAt: dateOrNow(courseProblem.createdAt),
    updatedAt: dateOrNow(courseProblem.updatedAt),
  }))
  await inBatches(courseProblemRows, 5_000, async (batch) => {
    await target.courseProblem.createMany({ data: batch, skipDuplicates: true })
  })

  await inBatches(contests, 1_000, async (batch) => {
    await target.contest.createMany({
      data: batch.map(contest => ({
        id: contest.contestId,
        title: postgresText(contest.title),
        startsAt: contest.startsAt,
        endsAt: contest.endsAt,
        scoreboardFrozenAt: contest.scoreboardFrozenAt ?? null,
        scoreboardUnfrozenAt: contest.scoreboardUnfrozenAt ?? null,
        isHidden: contest.isHidden ?? false,
        isLocked: contest.isLocked ?? false,
        isPublic: contest.isPublic ?? false,
        password: postgresText(contest.password),
        ipWhitelistEnabled: contest.ipWhitelistEnabled ?? false,
        allowEarlyExit: contest.allowEarlyExit ?? false,
        allowedLanguages: (contest.allowedLanguages ?? []).map(language => mapped(languages, language, 'Contest.allowedLanguages')),
        labelingStyle: mapped(labelingStyles, contest.labelingStyle ?? 1, 'Contest.labelingStyle'),
        courseId: contest.course
          ? requiredReference(courseIdByMongoId, contest.course, 'Contest.course')
          : null,
        createdAt: dateOrNow(contest.createdAt),
        updatedAt: dateOrNow(contest.updatedAt),
      })),
      skipDuplicates: true,
    })
  })
  const contestIdByMongoId = mongoMap(contests, contest => contest.contestId)

  const contestAllowedUsers = contests.flatMap(contest => (contest.allowedUsers ?? []).map(user => ({
    contestId: contest.contestId,
    userId: requiredReference(userIdByMongoId, user, 'Contest.allowedUsers'),
  })))
  const contestAllowedGroups = contests.flatMap(contest => (contest.allowedGroups ?? []).map(group => ({
    contestId: contest.contestId,
    groupId: requiredReference(groupIdByMongoId, group, 'Contest.allowedGroups'),
  })))
  const contestIpWhitelist = contests.flatMap(contest => (contest.ipWhitelist ?? []).map(rule => ({
    contestId: contest.contestId,
    cidr: rule.cidr,
    comment: rule.comment ?? null,
    createdAt: dateOrNow(contest.createdAt),
    updatedAt: dateOrNow(contest.updatedAt),
  })))
  let removedDuplicateContestProblems = 0
  const contestProblems = contests.flatMap((contest) => {
    const seenProblemIds = new Set<number>()
    return (contest.problems ?? []).flatMap((problem, index) => {
      const problemId = requiredReference(problemIdByMongoId, problem, 'Contest.problems')
      if (seenProblemIds.has(problemId)) {
        removedDuplicateContestProblems += 1
        return []
      }
      seenProblemIds.add(problemId)
      return [ {
        contestId: contest.contestId,
        problemId,
        position: index + 1,
        createdAt: dateOrNow(contest.createdAt),
        updatedAt: dateOrNow(contest.updatedAt),
      } ]
    })
  })
  await Promise.all([
    inBatches(contestAllowedUsers, 5_000, async (batch) => {
      await target.contestAllowedUser.createMany({ data: batch, skipDuplicates: true })
    }),
    inBatches(contestAllowedGroups, 5_000, async (batch) => {
      await target.contestAllowedGroup.createMany({ data: batch, skipDuplicates: true })
    }),
    inBatches(contestIpWhitelist, 5_000, async (batch) => {
      await target.contestIpWhitelist.createMany({ data: batch, skipDuplicates: true })
    }),
    inBatches(contestProblems, 5_000, async (batch) => {
      await target.contestProblem.createMany({ data: batch, skipDuplicates: true })
    }),
  ])

  const participationRows = contestParticipations.map(participation => ({
    contestId: requiredReference(contestIdByMongoId, participation.contest, 'ContestParticipation.contest'),
    userId: requiredReference(userIdByMongoId, participation.user, 'ContestParticipation.user'),
    status: mapped(participationStatuses, participation.status, 'ContestParticipation.status'),
    createdAt: dateOrNow(participation.createdAt),
    updatedAt: dateOrNow(participation.updatedAt),
  }))
  await inBatches(participationRows, 5_000, async (batch) => {
    await target.contestParticipation.createMany({ data: batch, skipDuplicates: true })
  })

  const discussionRows = discussions.map(discussion => ({
    id: discussion.discussionId,
    authorId: requiredReference(userIdByMongoId, discussion.author, 'Discussion.author'),
    problemId: discussion.problem
      ? requiredReference(problemIdByMongoId, discussion.problem, 'Discussion.problem')
      : null,
    contestId: discussion.contest
      ? requiredReference(contestIdByMongoId, discussion.contest, 'Discussion.contest')
      : null,
    type: mapped(discussionTypes, discussion.type ?? 3, 'Discussion.type'),
    isPinned: discussion.pinned ?? false,
    title: postgresText(discussion.title),
    createdAt: dateOrNow(discussion.createdAt),
    updatedAt: dateOrNow(discussion.updatedAt),
  }))
  await inBatches(discussionRows, 5_000, async (batch) => {
    await target.discussion.createMany({ data: batch, skipDuplicates: true })
  })
  const discussionIdByMongoId = mongoMap(discussions, discussion => discussion.discussionId)

  const commentRows = comments.map(comment => ({
    id: comment.commentId,
    discussionId: requiredReference(discussionIdByMongoId, comment.discussion, 'Comment.discussion'),
    authorId: requiredReference(userIdByMongoId, comment.author, 'Comment.author'),
    content: postgresText(comment.content),
    isHidden: comment.hidden ?? false,
    createdAt: dateOrNow(comment.createdAt),
    updatedAt: dateOrNow(comment.updatedAt),
  }))
  await inBatches(commentRows, 5_000, async (batch) => {
    await target.comment.createMany({ data: batch, skipDuplicates: true })
  })

  const fileRows = files.map(file => ({
    storageKey: file.storageKey,
    originalName: postgresText(file.originalName),
    sizeBytes: BigInt(file.sizeBytes),
    ownerId: requiredReference(userIdByMongoId, file.owner, 'Files.owner'),
    deletedAt: file.deletedAt ?? null,
    deletedById: file.deletedBy
      ? requiredReference(userIdByMongoId, file.deletedBy, 'Files.deletedBy')
      : null,
    createdAt: dateOrNow(file.createdAt),
    updatedAt: dateOrNow(file.updatedAt),
  }))
  await inBatches(fileRows, 5_000, async (batch) => {
    await target.file.createMany({ data: batch, skipDuplicates: true })
  })

  const oauthRows = oauthConnections.map(connection => ({
    userId: requiredReference(userIdByMongoId, connection.user, 'OAuth.user'),
    provider: postgresText(connection.provider),
    providerId: postgresText(connection.providerId),
    displayName: postgresText(connection.displayName),
    accessToken: postgresText(connection.accessToken),
    refreshToken: connection.refreshToken === null ? null : postgresText(connection.refreshToken),
    raw: connection.raw ?? Prisma.JsonNull,
    createdAt: dateOrNow(connection.createdAt),
    updatedAt: dateOrNow(connection.updatedAt),
  }))
  await inBatches(oauthRows, 5_000, async (batch) => {
    await target.oAuthConnection.createMany({ data: batch, skipDuplicates: true })
  })

  const postRows = posts.map(post => ({
    slug: postgresText(post.slug),
    title: postgresText(post.title),
    content: postgresText(post.content),
    publishesAt: post.publishesAt ?? dateOrNow(post.createdAt),
    isPublished: post.isPublished ?? false,
    isPinned: post.isPinned ?? false,
    isHidden: post.isHidden ?? false,
    createdAt: dateOrNow(post.createdAt),
    updatedAt: dateOrNow(post.updatedAt),
  }))
  await inBatches(postRows, 5_000, async (batch) => {
    await target.post.createMany({ data: batch, skipDuplicates: true })
  })

  const settingRows = settings.map(setting => ({
    key: setting.key,
    value: setting.value,
    createdAt: dateOrNow(setting.createdAt),
    updatedAt: dateOrNow(setting.updatedAt),
  }))
  await inBatches(settingRows, 5_000, async (batch) => {
    await target.setting.createMany({ data: batch, skipDuplicates: true })
  })

  let submissions = 0
  let submissionTestcaseResults = 0
  const cursor = source.collection<LegacySubmission>('Solution').find({}).batchSize(1_000)
  let batch: LegacySubmission[] = []

  async function writeSubmissionBatch (items: LegacySubmission[]) {
    if (items.length === 0) {
      return
    }

    const rows: PreparedSubmission[] = []
    for (const submission of items) {
      let userId = targetUserIdByUsername.get(submission.uid)
      if (userId === undefined) {
        const archivedUser = await target.user.upsert({
          where: { username: archivedUsername(submission.uid) },
          create: {
            username: archivedUsername(submission.uid),
            passwordHash: '',
            nickname: submission.uid,
          },
          update: {},
          select: { id: true },
        })
        userId = archivedUser.id
        targetUserIdByUsername.set(submission.uid, userId)
      }
      rows.push({ submission, userId })
    }

    const submissionsToInsert = rows.map((row) => {
      const { submission, userId } = row
      return {
        id: submission.sid,
        problemId: submission.pid,
        userId,
        contestId: submission.mid && submission.mid > 0 && targetContestIds.has(submission.mid)
          ? submission.mid
          : null,
        courseId: submission.course
          ? requiredReference(courseIdByMongoId, submission.course, 'Solution.course')
          : null,
        sourceCode: postgresText(submission.code),
        language: mapped(languages, submission.language, 'Solution.language'),
        status: mapped(judgeStatuses, submission.judge ?? 0, 'Solution.judge'),
        timeUsedMs: submission.time ?? 0,
        memoryUsedKb: submission.memory ?? 0,
        errorMessage: postgresText(submission.error),
        similarity: submission.sim ?? 0,
        similarSubmissionId: submission.sim_s_id && submission.sim_s_id > 0
          ? submission.sim_s_id
          : null,
        createdAt: submissionDate(submission),
        updatedAt: dateOrNow(submission.updatedAt ?? submission.createdAt),
      }
    })

    const existingProblemIds = new Set(
      (await target.problem.findMany({
        where: { id: { in: [ ...new Set(submissionsToInsert.map(row => row.problemId)) ] } },
        select: { id: true },
      })).map(problem => problem.id),
    )
    const missingProblemIds = [ ...new Set(
      submissionsToInsert
        .map(row => row.problemId)
        .filter(problemId => !existingProblemIds.has(problemId)),
    ) ]
    if (missingProblemIds.length > 0) {
      await target.problem.createMany({
        data: missingProblemIds.map(id => ({
          id,
          title: `Deleted Problem ${id}`,
        })),
        skipDuplicates: true,
      })
    }

    await target.submission.createMany({ data: submissionsToInsert, skipDuplicates: true })

    const importedSubmissionIds = new Set(submissionsToInsert.map(row => row.id))
    const testcaseRows = items
      .filter(submission => importedSubmissionIds.has(submission.sid))
      .flatMap(submission => (submission.testcases ?? []).map(testcase => ({
        submissionId: submission.sid,
        testcaseId: testcase.uuid,
        status: mapped(judgeStatuses, testcase.judge, 'Solution.testcases.judge'),
        timeUsedMs: testcase.time,
        memoryUsedKb: testcase.memory,
      })))
    await inBatches(testcaseRows, 5_000, async (testcaseBatch) => {
      await target.submissionTestcaseResult.createMany({
        data: testcaseBatch,
        skipDuplicates: true,
      })
    })

    submissions += submissionsToInsert.length
    submissionTestcaseResults += testcaseRows.length
  }

  for await (const submission of cursor) {
    batch.push(submission)
    if (batch.length >= 1_000) {
      await writeSubmissionBatch(batch)
      batch = []
    }
  }
  await writeSubmissionBatch(batch)

  await synchronizeTargetSequences(target)

  return {
    courses: courses.length,
    courseMembers: courseMemberRows.length,
    courseProblems: courseProblemRows.length,
    contests: contests.length,
    contestAllowedUsers: contestAllowedUsers.length,
    contestAllowedGroups: contestAllowedGroups.length,
    contestIpWhitelist: contestIpWhitelist.length,
    contestProblems: contestProblems.length,
    removedDuplicateContestProblems,
    contestParticipations: participationRows.length,
    discussions: discussionRows.length,
    comments: commentRows.length,
    files: fileRows.length,
    oauthConnections: oauthRows.length,
    posts: postRows.length,
    settings: settingRows.length,
    submissions,
    skippedSubmissions: 0,
    submissionTestcaseResults,
  }
}

export async function migrateAllEntities (
  source: Db,
  target: PrismaClient,
): Promise<FullMigrationReport> {
  const base = await migrateBaseEntities(source, target)
  const remaining = await migrateRemainingEntities(source, target)
  const statistics = await rebuildStatistics(target)
  return { ...base, ...remaining, ...statistics }
}
