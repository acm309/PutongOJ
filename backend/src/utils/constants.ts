import type { CourseRole } from '../types'
import { ErrorCode } from '@putongoj/shared'

export const privilege = Object.freeze({
  Banned: 0,
  User: 1,
  Admin: 2,
  Root: 3,
})

export const judge = Object.freeze({
  Pending: 0,
  Running: 1,
  CompileError: 2,
  Accepted: 3,
  RuntimeError: 4,
  WrongAnswer: 5,
  TimeLimitExceeded: 6,
  MemoryLimitExceed: 7,
  OutputLimitExceed: 8,
  PresentationError: 9,
  SystemError: 10,
  RejudgePending: 11,
  Skipped: 12,
})

export const judgeResult = judge

export const limitation = Object.freeze({
  time: 10 * 1000,
  memory: 256 * 1024,
})

export const status = Object.freeze({
  Reserve: 0,
  Available: 2,
})

export const encrypt = Object.freeze({
  Public: 1,
  Private: 2,
  Password: 3,
})

export const problemType = Object.freeze({
  Traditional: 1,
  Interaction: 2,
  SpecialJudge: 3,
})

export const deploy = Object.freeze({
  adminInitPwd: 'kplkplkpl',
})

export const courseRoleNone = Object.freeze({
  basic: false,
  viewTestcase: false,
  viewSolution: false,
  manageProblem: false,
  manageContest: false,
  manageCourse: false,
} as CourseRole)

export const courseRoleEntire = Object.freeze({
  basic: true,
  viewTestcase: true,
  viewSolution: true,
  manageProblem: true,
  manageContest: true,
  manageCourse: true,
} as CourseRole)

export const contestLabelingStyle = Object.freeze({
  numeric: 1,
  alphabetic: 2,
})

type ErrorTuple = Readonly<[number, string]>

export const ERR_INVALID_ID: ErrorTuple = [
  ErrorCode.BadRequest,
  'Invalid entity ID, please check the parameters.',
] as const

export const ERR_BAD_PARAMS: ErrorTuple = [
  ErrorCode.BadRequest,
  'Bad request parameters, please check the parameters.',
] as const

export const ERR_LOGIN_REQUIRE: ErrorTuple = [
  ErrorCode.Unauthorized,
  'Unauthenticated user, please login first.',
] as const

export const ERR_PERM_DENIED: ErrorTuple = [
  ErrorCode.Forbidden,
  'Permission denied, you do not have the required privileges.',
] as const

export const ERR_NOT_FOUND: ErrorTuple = [
  ErrorCode.NotFound,
  'Entity not found, please check the ID.',
] as const

export const ERR_UNKNOWN: ErrorTuple = [
  ErrorCode.InternalServerError,
  'Unknown error, sit back and relax, it is not your fault.',
] as const

export default Object.freeze({
  deploy,
  encrypt,
  judge,
  limitation,
  privilege,
  problemType,
  status,
  courseRoleNone,
  courseRoleEntire,
  contestLabelingStyle,
})
