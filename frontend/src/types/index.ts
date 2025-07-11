import type { privilege, status } from '@/util/constant'

export interface TimeResp {
  serverTime: number
}

export interface WebsiteConfigResp {
  website: {
    title: string
    buildSHA: string
    buildTime: number
  }
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

export interface ProblemBrief extends Problem {
  solve: number
  submit: number
  status: keyof typeof status
  tags: string[]
}

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

export type ContestDetail = Contest & {
  list: number[]
  argument: string
  create: number
}

export interface RawRanklist {
  [uid: string]: {
    nick: string
    [pid: number]: {
      accepted: number
      failed: number
      pending: number
    } | null
  }
}

export interface RanklistInfo {
  freezeTime: number
  isFrozen: boolean
  isEnded: boolean
  isCache: boolean
}

export interface RanklistRow {
  uid: string
  nick: string
  solved: number
  penalty: number
  [pid: number]: {
    accepted: number
    failed: number
    pending: number
    isPrime?: boolean
  } | null
}

export type Ranklist = RanklistRow[]
