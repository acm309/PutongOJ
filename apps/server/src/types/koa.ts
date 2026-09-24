import type { UserDocument } from '@putong-oj/db'
import type { ContestState } from '../policies/contest.ts'
import type { CourseState } from '../policies/course.ts'
import type { DiscussionState } from '../policies/discussion.ts'
import type { PostState } from '../policies/post.ts'
import type { ProblemState } from '../policies/problem.ts'
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
    post?: PostState
    problem?: ProblemState
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
      warn: (message: string) => void
      error: (message: string, error?: any) => void
    }
  }
}
