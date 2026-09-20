import type { SolutionModel } from '@putong-oj/shared'

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
