import type { ContestModel } from '@putongoj/shared'
import type { Types } from 'mongoose'
import type { CourseDocument } from '../models/Course'
import type { PaginateOption, SortOption } from '../types'
import type { ContestRanklist, SolutionEntity } from '../types/entity'
import type { QueryFilter } from '../types/mongo'
import { ParticipationStatus } from '@putongoj/shared'
import { escapeRegExp } from 'lodash'
import Contest from '../models/Contest'
import ContestParticipation from '../models/ContestParticipation'
import Solution from '../models/Solution'
import User from '../models/User'
import { judge } from '../utils/constants'

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

async function createContest (contest: Partial<ContestModel>) {
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
    { upsert: true, new: true },
  )
}

async function getRanklist (
  contestId: number,
  isFrozen: boolean = false,
  freezeTime: number = 0,
): Promise<ContestRanklist> {
  const ranklist = {} as ContestRanklist
  const userIdSet = new Set<string>()
  const solutions = await Solution
    .find(
      { mid: contestId },
      { _id: 0, pid: 1, uid: 1, judge: 1, createdAt: 1 },
    )
    .sort({ create: 1 })
    .lean()

  solutions.forEach((solution: SolutionEntity) => {
    const { pid, uid, judge: judgement, createdAt } = solution
    if (judgement === judge.CompileError || judgement === judge.SystemError || judgement === judge.Skipped) {
      // 如果是 Compile Error / System Error /  Skipped 视为不计入任何结果
      return
    }

    if (!ranklist[uid]) {
      ranklist[uid] = { nick: '' }
      userIdSet.add(uid)
    }
    if (!ranklist[uid][pid]) {
      ranklist[uid][pid] = {
        failed: 0, // 错误提交的计数
        pending: 0, // 无结果的提交计数
      }
    }

    const createdTimestamp = new Date(createdAt).getTime()
    const item = ranklist[uid][pid]

    if (item.acceptedAt) {
      // 已经有正确提交了则不需要再更新了
      return
    }
    if (isFrozen && createdTimestamp >= freezeTime) {
      // 封榜时间内的提交视为无结果
      item.pending += 1
      return
    }
    if (judgement === judge.Pending || judgement === judge.RejudgePending || judgement === judge.Running) {
      // 如果是 Pending / Running 视为无结果
      item.pending += 1
      return
    }
    if (judgement === judge.Accepted) {
      // 如果是 Accepted 视为正确提交
      item.acceptedAt = createdTimestamp
    } else {
      // 否则视为错误提交
      item.failed += 1
    }
  })

  const users = await User
    .find(
      { uid: { $in: Array.from(userIdSet) } },
      { _id: 0, uid: 1, nick: 1 },
    )
    .lean()
  const userNickMap = Object
    .fromEntries(users.map(
      user => [ user.uid, user.nick ],
    ))
  Object.keys(ranklist).forEach((uid) => {
    ranklist[uid].nick = userNickMap[uid]
  })

  return ranklist
}

export const contestService = {
  findContests,
  getContest,
  createContest,
  updateContest,
  getParticipation,
  updateParticipation,
  getRanklist,
} as const
