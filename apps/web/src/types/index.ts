import type { Language, ProblemListQueryResult } from '@putongoj/shared'

export interface TimeResp {
  serverTime: number
}

export interface Solution {
  language: Language | null
  sourceCode: string
}

export type ProblemBrief = ProblemListQueryResult['items'][number]

export interface SessionInfo {
  sessionId: string
  current: boolean
  active: boolean
  loginAt: string
  loginIp: string
  lastAccessAt: Date
  browser: string
  os: string
}
