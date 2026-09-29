import type { Types } from '@putong-oj/db'
import type {
  JudgeStatus,
  Language,
  Paginated,
  SolutionModel,
} from '@putong-oj/shared'
import type { PaginateOption, SortOption } from '../types/index.ts'
import { Contest, Solution, User } from '@putong-oj/db'
import { EXPORT_SIZE_MAX } from '@putong-oj/shared'
import escapeRegExp from 'lodash/escapeRegExp.js'

interface SolutionFilterOption {
  user?: string | Types.ObjectId
  problem?: number
  contest?: number | Types.ObjectId | null
  judge?: JudgeStatus
  language?: Language
}

type SolutionWithRelations = Omit<SolutionModel, 'contest' | 'user'> & {
  contest: { contestId: number } | null
  user: { uid: string }
}

async function constructSolutionFilter (opt: SolutionFilterOption) {
  const { user, problem, contest, judge, language } = opt
  const filter: Record<string, any> = {}

  if (user !== undefined && typeof user !== 'string') {
    filter.user = user
  } else if (typeof user === 'string') {
    const userDoc = await User
      .findOne({ uid: { $regex: new RegExp(`^${escapeRegExp(user)}$`, 'i') } }, '_id')
      .lean()
    filter.user = userDoc?._id ?? { $in: [] }
  }
  if (typeof problem === 'number') {
    filter.pid = problem
  }
  if (contest === null || contest === -1) {
    filter.contest = null
  } else if (typeof contest === 'number') {
    const contestDoc = await Contest
      .findOne({ contestId: contest }, '_id')
      .lean()
    filter.contest = contestDoc?._id ?? { $in: [] }
  } else if (contest !== undefined) {
    filter.contest = contest
  }
  if (typeof judge === 'number') {
    filter.judge = judge
  }
  if (typeof language === 'number') {
    filter.language = language
  }
  return filter
}

export async function findSolutions (
  opt: PaginateOption & SortOption & SolutionFilterOption,
): Promise<Paginated<SolutionWithRelations>> {
  const { page, pageSize, sort, sortBy } = opt
  const filter = await constructSolutionFilter(opt)

  const query = {
    sort: {
      [sortBy]: sort,
      ...(sortBy !== 'createdAt' ? { createdAt: -1 } : {}),
    },
    page,
    limit: pageSize,
    lean: true,
    leanWithId: false,
    populate: [
      {
        path: 'contest',
        select: 'contestId',
      },
      {
        path: 'user',
        select: 'uid',
      },
    ],
  }
  return await Solution.paginate(filter, query) as any
}

export async function exportSolutions (
  opt: SortOption & SolutionFilterOption,
): Promise<(Pick<SolutionModel,
'sid' | 'pid' | 'language' | 'judge'
| 'time' | 'memory' | 'similarity' | 'createdAt'>
& { uid: string, contestId: number | null })[]> {
  const { sort, sortBy } = opt
  const filter = await constructSolutionFilter(opt)

  const solutions = await Solution.find(filter)
    .select({
      _id: 0, sid: 1, pid: 1, user: 1, contest: 1, language: 1, judge: 1,
      time: 1, memory: 1, similarity: 1, createdAt: 1,
    })
    .populate<{
    contest: { contestId: number } | null
    user: { uid: string } | null
  }>([
      { path: 'contest', select: 'contestId' },
      { path: 'user', select: 'uid' },
    ])
    .sort({
      [sortBy]: sort,
      ...(sortBy !== 'createdAt' ? { createdAt: -1 } : {}),
    })
    .limit(EXPORT_SIZE_MAX)
    .lean()

  return solutions.map(({ contest, user, ...solution }) => ({
    ...solution,
    uid: user?.uid ?? 'ghost',
    contestId: contest?.contestId ?? null,
  }))
}

const solutionService = {
  findSolutions,
  exportSolutions,
} as const

export default solutionService
