import type { ProblemEntityPreview } from '@backend/types/entity'
import type { SolutionModel } from '@putongoj/shared'

export interface TimeResp {
  serverTime: number
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
