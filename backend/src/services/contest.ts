import type { ContestModel, ContestRanklist, ContestRanklistProblem } from '@putongoj/shared'
import type { Types } from 'mongoose'
import type { CourseDocument } from '../models/Course'
import type { PaginateOption, SortOption } from '../types'
import type { QueryFilter } from '../types/mongo'
import { JudgeStatus, ParticipationStatus } from '@putongoj/shared'
import { escapeRegExp } from 'lodash'
import Contest from '../models/Contest'
import ContestParticipation from '../models/ContestParticipation'
import Problem from '../models/Problem'
import Solution from '../models/Solution'
import User from '../models/User'
import { CacheKey, cacheService } from './cache'

async function findContests (
  options: PaginateOption & SortOption,
  filters: { title?: string, course?: Types.ObjectId },
  showHidden: boolean = false,
) {
  const { page, pageSize, sort, sortBy } = options
  const queryFilters: QueryFilter<ContestModel>[] = []

  if (!showHidden) {
    queryFilters.push({ isHidden: { $ne: true } })
  }
  if (filters.title) {
    queryFilters.push({
      title: { $regex: new RegExp(escapeRegExp(String(filters.title)), 'i') },
    })
  }
  if (filters.course) {
    queryFilters.push({ course: filters.course })
  } else if (!showHidden) {
    queryFilters.push({
      $or: [
        { course: { $exists: false } },
        { course: null } ],
    })
  }

  const fields = [ '_id', 'contestId', 'title', 'startsAt', 'endsAt', 'isPublic' ]
  if (showHidden) {
    fields.push('isHidden')
  }
  const docsPromise = Contest
    .find({ $and: queryFilters })
    .sort({
      [sortBy]: sort,
      ...(sortBy !== 'createdAt' ? { createdAt: -1 } : {}),
    })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .select(fields)
    .lean()
  const countPromise = Contest.countDocuments({ $and: queryFilters })

  const [ docs, count ] = await Promise.all([ docsPromise, countPromise ])
  const result = {
    docs,
    limit: pageSize,
    page,
    pages: Math.ceil(count / pageSize),
    total: count,
  }
  return result
}

async function getContest (contestId: number) {
  const contest = await Contest
    .findOne({ contestId })
    .populate<{ course: CourseDocument }>('course')
  return contest
}

export type ContestWithCourse = NonNullable<Awaited<ReturnType<typeof getContest>>>

type ContestCreateDto = Pick<ContestModel,
  'title' | 'startsAt' | 'endsAt' | 'isHidden' | 'isPublic' | 'course'>

async function createContest (contest: ContestCreateDto) {
  const createdContest = new Contest(contest)
  await createdContest.save()
  return createdContest.toObject()
}

async function updateContest (
  contestId: number,
  update: Partial<ContestModel>,
): Promise<boolean> {
  const res = await Contest.updateOne(
    { contestId },
    { $set: update },
  )
  return res.modifiedCount > 0
}

async function getParticipation (user: Types.ObjectId, contest: Types.ObjectId): Promise<ParticipationStatus> {
  const participation = await ContestParticipation
    .findOne({ user, contest })
    .lean()
  if (!participation) {
    return ParticipationStatus.NotApplied
  }
  return participation.status as ParticipationStatus
}

async function updateParticipation (
  user: Types.ObjectId,
  contest: Types.ObjectId,
  status: ParticipationStatus,
): Promise<void> {
  await ContestParticipation.findOneAndUpdate(
    { user, contest },
    { user, contest, status },
    { upsert: true, returnDocument: 'after' },
  )
}

export type ContestProblemsWithStats = {
  index: number
  problemId: number
  title: string
  submit: number
  solve: number
}[]

const ignoredJudges = [ JudgeStatus.CompileError, JudgeStatus.SystemError, JudgeStatus.Skipped ] as number[]

async function getProblemsWithStats (contest: Types.ObjectId, isJury: boolean) {
  return await cacheService.getOrCreate<ContestProblemsWithStats>(
    CacheKey.contestProblems(contest, isJury),

    async () => {
      const contestDoc = await Contest
        .findById(contest)
        .select({ _id: 0, contestId: 1, endsAt: 1, scoreboardFrozenAt: 1, problems: 1 })
        .lean()
      if (!contestDoc || contestDoc.problems.length === 0) {
        return []
      }

      const { contestId, endsAt, scoreboardFrozenAt } = contestDoc
      const problems = await Problem
        .find({ _id: { $in: contestDoc.problems } })
        .select({ _id: 1, pid: 1, title: 1 })
        .lean()
      const before = (scoreboardFrozenAt && !isJury)
        ? scoreboardFrozenAt
        : endsAt

      return await Promise.all(problems.map(async ({ _id, pid, title }) => {
        const [ { length: submit }, { length: solve } ] = await Promise.all([
          Solution.distinct('uid', {
            mid: contestId,
            pid,
            judge: { $nin: ignoredJudges },
            createdAt: { $lt: before },
          }).lean(),
          Solution.distinct('uid', {
            mid: contestId,
            pid,
            judge: JudgeStatus.Accepted,
            createdAt: { $lt: before },
          }).lean(),
        ])
        const problemId = pid
        const index = contestDoc.problems.findIndex(p => p.equals(_id)) + 1

        return { index, problemId, title, submit, solve }
      }))
    },

    { ttl: 10 },
  )
}

const pendingJudges = [ JudgeStatus.Pending, JudgeStatus.RejudgePending, JudgeStatus.RunningJudge ] as number[]

async function getRanklist (contest: Types.ObjectId, isJury: boolean) {
  return await cacheService.getOrCreate<ContestRanklist>(
    CacheKey.contestRanklist(contest, isJury),

    async () => {
      const contestDoc = await Contest
        .findById(contest)
        .select({ _id: 0, contestId: 1, endsAt: 1, scoreboardFrozenAt: 1 })
        .lean()
      if (!contestDoc) {
        return []
      }

      const { contestId, endsAt, scoreboardFrozenAt } = contestDoc
      const ranklistRecord: Record<string, Record<number, ContestRanklistProblem>> = {}
      const solutions = await Solution
        .find({
          mid: contestId,
          judge: { $nin: ignoredJudges },
          createdAt: { $lt: endsAt },
        })
        .select({ _id: 0, pid: 1, uid: 1, judge: 1, createdAt: 1 })
        .sort({ createdAt: 1 })
        .lean()

      solutions.forEach((solution) => {
        const { pid: problemId, uid: username, judge: judgement, createdAt } = solution

        if (!ranklistRecord[username]) {
          ranklistRecord[username] = {}
        }
        const userRecord = ranklistRecord[username]

        if (!userRecord[problemId]) {
          userRecord[problemId] = { problemId, failedCount: 0, pendingCount: 0 }
        }
        const item = userRecord[problemId]

        if (item.solvedAt) {
          // already solved, ignore subsequent submissions
          return
        }

        if (!isJury && scoreboardFrozenAt && createdAt >= scoreboardFrozenAt) {
          // scoreboard is frozen, and the submission is after the freeze time, count it as pending
          item.pendingCount += 1
          return
        }

        if (pendingJudges.includes(judgement)) {
          item.pendingCount += 1
          return
        }

        if (judgement === JudgeStatus.Accepted) {
          item.solvedAt = createdAt.toISOString()
          return
        }

        item.failedCount += 1
      })

      const users = await User
        .find({ uid: { $in: Object.keys(ranklistRecord) } })
        .select({ _id: 0, uid: 1, nick: 1 })
        .lean()
      const nicknameMap = Object.fromEntries(users.map(user => [ user.uid, user.nick ]))

      return Object.entries(ranklistRecord).map(([ username, problems ]) => ({
        username,
        nickname: nicknameMap[username] || username,
        problems: Object.values(problems),
      }))
    },

    // Frontend's auto-refresh interval is 10s,
    // so the cache TTL is set a bit shorter.
    { ttl: 9 },
  )
}

export const contestService = {
  findContests,
  getContest,
  createContest,
  updateContest,
  getParticipation,
  updateParticipation,
  getProblemsWithStats,
  getRanklist,
} as const
