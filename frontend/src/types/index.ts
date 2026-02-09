import type { ContestEntityView, ProblemEntityPreview } from '@backend/types/entity'
import type { SolutionModel } from '@putongoj/shared'
import type { privilege } from '@/utils/constant'

export interface TimeResp {
  serverTime: number
}

export type UserPrivilege = (typeof privilege)[keyof typeof privilege]

export interface User {
  uid: string
  nick?: string
  privilege: UserPrivilege
  create?: number
}

export type Profile = User & {
  verifyContest: number[]
}

export interface LoginParam {
  uid: string
  pwd: string
}

export interface Paginated<T> {
  docs: T[]
  limit: number
  page: number
  pages: number
  total: number
}

export interface Problem {
  pid: number
  title: string
}

export type ProblemBrief = ProblemEntityPreview

export interface ProblemDetail extends Problem {
  description: string
  input: string
  output: string
}

export interface Solution {
  language: number | null
  code: string
}

export interface Contest {
  cid: number
  title: string
  start: number
  end: number
  encrypt: number
  status: number
}

/** @deprecated */
export type ContestDetail = ContestEntityView

export interface SolutionModelDataTable {
  sid: SolutionModel['sid']
  uid?: SolutionModel['uid']
  pid?: SolutionModel['pid']
  mid?: SolutionModel['mid']
  judge: SolutionModel['judge']
  sim: SolutionModel['sim']
  time: SolutionModel['time']
  memory: SolutionModel['memory']
  language: SolutionModel['language']
  createdAt: SolutionModel['createdAt']
}
