import type { CourseRole, SessionProfile } from '.'
import type { CourseDocument } from '../models/Course'
import type { UserDocument } from '../models/User'
import 'koa'

declare module 'koa' {
  interface DefaultState {
    authnChecked?: boolean
    profile?: UserDocument
    course?: CourseDocument
    courseRole?: CourseRole
  }

  interface DefaultContext {
    state: DefaultState
    session: {
      profile?: SessionProfile
    }
  }
}
