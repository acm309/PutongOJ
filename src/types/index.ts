import type { privilege } from '@/util/constant'
export interface TimeResp {
  serverTime: number
}

export interface WebsiteConfigResp {
  website: {
    discussOnProblem: boolean // obsolete
    semi_restful: boolean
    title: string
  }
}

export interface User {
  nick: 'string'
  uid: number
  privilege: (typeof privilege)[keyof typeof privilege]
}

export type Profile = User & {
  verifyContest: number[]
}

export interface LoginParam {
  uid: string
  pwd: string
}

export interface Paginated<T> {
  list: {
    docs: T[]
    limit: number
    page: number
    pages: number
    total: number
  }
}

export interface Problem {
  pid: number
  title: string
  description: string
  input: string
  output: string
}
