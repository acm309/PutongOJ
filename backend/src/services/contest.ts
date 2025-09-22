import type { ObjectId } from 'mongoose'
import type { ContestDocument, ContestDocumentPopulated } from '../models/Contest'
import type { Paginated, PaginateOption } from '../types'
import type { ContestEntityEditable, ContestEntityPreview, ContestRanklist, SolutionEntity } from '../types/entity'
import { escapeRegExp } from 'lodash'
import Contest from '../models/Contest'
import Solution from '../models/Solution'
import User from '../models/User'
import { judge, status } from '../utils/constants'

export async function findContests (
  opt: PaginateOption & {
    type?: string
    content?: string
  },
  showAll: boolean = false,
  course: ObjectId | null = null,
): Promise<Paginated<ContestEntityPreview>> {
  const { page, pageSize, content, type } = opt
  const filters: Record<string, any>[] = []

  if (!showAll) {
    filters.push({ status: status.Available })
  }
  if (content) {
    switch (type) {
      case 'title':
        filters.push({
          title: { $regex: new RegExp(escapeRegExp(String(content)), 'i') },
        })
        break
    }
  }
  if (course) {
    filters.push({ course })
  } else if (!showAll) {
    filters.push({
      $or: [
        { course: { $exists: false } },
        { course: null } ],
    })
  }

  const result = await Contest.paginate({ $and: filters }, {
    sort: { cid: -1 },
    page,
    limit: pageSize,
    lean: true,
    leanWithId: false,
    select: '-_id cid title start end encrypt status',
  }) as any
  return result
}

export async function getContest (
  cid: number,
): Promise<ContestDocumentPopulated | null> {
  const contest = await Contest
    .findOne({ cid })
    .populate('course')
  return contest
}

export async function createContest (
  opt: ContestEntityEditable,
): Promise<ContestDocument> {
  const contest = new Contest(opt)
  await contest.save()
  return contest
}

export async function updateContest (
  cid: number,
  opt: Partial<ContestEntityEditable>,
): Promise<ContestDocument | null> {
  const contest = await Contest
    .findOneAndUpdate({ cid }, opt, { new: true })
    .populate('course')
  return contest
}

export async function removeContest (cid: number): Promise<boolean> {
  const result = await Contest.deleteOne({ cid })
  return result.deletedCount > 0
}

export async function getRanklist (
  cid: number,
  isFrozen: boolean = false,
  startTime: number = 0,
  freezeTime: number = 0,
): Promise<ContestRanklist> {
  const ranklist = {} as ContestRanklist
  const userIdSet = new Set<string>()
  const solutions = await Solution
    .find(
      { mid: cid },
      { _id: 0, pid: 1, uid: 1, judge: 1, createdAt: 1 },
    )
    .sort({ create: 1 })
    .lean()

  solutions.forEach((solution: SolutionEntity) => {
    const { pid, uid, judge: judgement, createdAt } = solution
    const createdTS = new Date(createdAt).getTime()

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
    const item = ranklist[uid][pid]

    if (item.acceptedAt) {
      // 已经有正确提交了则不需要再更新了
      return
    }
    if (isFrozen && createdTS >= freezeTime) {
      // 封榜时间内的提交视为无结果
      item.pending += 1
      return
    }
    if (judgement === judge.Pending || judgement === judge.Running) {
      // 如果是 Pending / Running 视为无结果
      item.pending += 1
      return
    }
    if (judgement === judge.Accepted) {
      // 如果是 Accepted 视为正确提交
      item.acceptedAt = Math.floor((createdTS - startTime) / 1000)
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

const contestService = {
  findContests,
  getContest,
  createContest,
  updateContest,
  removeContest,
  getRanklist,
} as const

export default contestService
