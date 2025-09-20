import type { CourseRole, SessionProfile } from '.'
import type { ContestDocument } from '../models/Contest'
import type { CourseDocument } from '../models/Course'
import type { ProblemDocumentPopulated } from '../models/Problem'
import type { TagDocument } from '../models/Tag'
import type { UserDocument } from '../models/User'
import 'koa'

declare module 'koa' {
  interface DefaultState {
    requestId?: string
    authnChecked?: boolean
    contest?: ContestDocument
    course?: CourseDocument
    courseRole?: CourseRole
    problem?: ProblemDocumentPopulated
    profile?: UserDocument
    tag?: TagDocument
    user?: UserDocument
  }

  interface DefaultContext {
    state: DefaultState
    session: {
      profile?: SessionProfile
    }
  }
}
