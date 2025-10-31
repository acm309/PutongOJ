import type { CourseRole } from '@backend/types'
import { JudgeStatus, Language, UserPrivilege } from '@putongoj/shared'

export const languageHighlight = {
  [Language.C]: 'c',
  [Language.Cpp11]: 'cpp',
  [Language.Cpp17]: 'cpp',
  [Language.Java]: 'java',
  [Language.PyPy]: 'python',
  [Language.Python]: 'python',
} as const

export const color = {
  0: 'pd',
  1: 'rj',
  2: 'ce',
  3: 'ac',
  4: 're',
  5: 'wa',
  6: 'tle',
  7: 'mle',
  8: 'ole',
  9: 'pe',
  10: 'se',
  11: 'rp',
} as const

export const statisTableObj = [
  'Compile Error',
  'Accepted',
  'Runtime Error',
  'Wrong Answer',
  'Time Limit Exceeded',
  'Memory Limit Exceeded',
  'Output Limit Exceeded',
  'Presentation Error',
  'System Error',
] as const

export const contestStatus = {
  0: 'Running',
  2: 'Ended',
} as const

export const contestType = {
  1: 'Public',
  2: 'Private',
  3: 'Password',
} as const

export const problemType = {
  1: 'Traditional',
  2: 'Interaction',
  3: 'Special Judge',
} as const

export const status = {
  0: 'Reserve', // 是否开放给普通用户
  2: 'Available',
} as const

export const privilege = {
  Banned: 0,
  User: 1,
  Admin: 2,
  Root: 3,
} as const

export const courseRoleFields: readonly (keyof CourseRole)[] = [
  'basic',
  'viewTestcase',
  'viewSolution',
  'manageProblem',
  'manageContest',
  'manageCourse',
]

export const privilegeOptions = [
  { label: 'Banned', value: UserPrivilege.Banned },
  { label: 'User', value: UserPrivilege.User },
  { label: 'Admin', value: UserPrivilege.Admin },
  { label: 'Root', value: UserPrivilege.Root },
]

export const judgeStatusLabels: Record<JudgeStatus, string> = {
  [JudgeStatus.Pending]: 'Pending',
  [JudgeStatus.RunningJudge]: 'Running & Judge',
  [JudgeStatus.CompileError]: 'Compile Error',
  [JudgeStatus.Accepted]: 'Accepted',
  [JudgeStatus.RuntimeError]: 'Runtime Error',
  [JudgeStatus.WrongAnswer]: 'Wrong Answer',
  [JudgeStatus.TimeLimitExceeded]: 'Time Limit Exceeded',
  [JudgeStatus.MemoryLimitExceeded]: 'Memory Limit Exceeded',
  [JudgeStatus.OutputLimitExceeded]: 'Output Limit Exceeded',
  [JudgeStatus.PresentationError]: 'Presentation Error',
  [JudgeStatus.SystemError]: 'System Error',
  [JudgeStatus.RejudgePending]: 'Rejudge Pending',
  [JudgeStatus.Skipped]: 'Skipped',
} as const

export const judgeStatusOptions = Object.entries(judgeStatusLabels)
  .map(([ value, label ]) => ({ label, value: Number.parseInt(value) }))

/** @deprecated use `judgeStatusLabels` instead */
export const result = judgeStatusLabels
/** @deprecated use `judgeStatusOptions` instead */
export const judgeList = judgeStatusOptions

export const languagesOrder: Language[] = [
  Language.Cpp11,
  Language.Cpp17,
  Language.C,
  Language.Java,
  Language.Python,
  Language.PyPy,
]

export const languageLabels: Record<Language, string> = {
  [Language.C]: 'C',
  [Language.Cpp11]: 'C++ 11',
  [Language.Cpp17]: 'C++ 17',
  [Language.Java]: 'Java',
  [Language.PyPy]: 'PyPy 3',
  [Language.Python]: 'Python 3',
}

export const languageOptions = languagesOrder.map(lang => ({
  label: languageLabels[lang],
  value: lang,
}))

/** @deprecated use `languageLabels` instead */
export const language = languageLabels
/** @deprecated use `languageOptions` instead */
export const languageList = languageOptions

export default {
  result,
  judgeList,
  language,
  languageList,
  languageHighlight,
  color,
  statisTableObj,
  contestStatus,
  contestType,
  problemType,
  status,
  privilege,
  courseRoleFields,
} as const
