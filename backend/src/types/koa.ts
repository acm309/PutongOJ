import type { TagDocument } from '../models/Tag'
import type { UserDocument } from '../models/User'
import type { ContestState } from '../policies/contest'
import type { CourseState } from '../policies/course'
import type { DiscussionState } from '../policies/discussion'
import type { ProblemState } from '../policies/problem'
import 'koa'

declare module 'koa' {
  interface DefaultState {
    clientIp: string
    requestId: string
    authnChecked?: boolean
    profile?: UserDocument
    sessionId?: string

    contest?: ContestState
    course?: CourseState
    discussion?: DiscussionState
    problem?: ProblemState
    tag?: TagDocument
    user?: UserDocument
  }

  interface DefaultContext {
    state: DefaultState
    session: {
      userId?: string
      sessionId?: string
    }
    auditLog: {
      info: (message: string) => void
      error: (message: string, error?: any) => void
      warn: (message: string) => void
    }
  }
}
