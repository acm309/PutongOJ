import type { CourseRole } from '../types'

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

export const tagColors = Object.freeze([
  'default',
  'magenta',
  'red',
  'volcano',
  'orange',
  'gold',
  'yellow',
  'lime',
  'green',
  'cyan',
  'blue',
  'geekblue',
  'purple',
] as const)

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
  tagColors,
})
