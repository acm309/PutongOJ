import type { CourseRole } from '@/types'

export const result = {
  0: 'Pending',
  1: 'Running & Judge',
  2: 'Compile Error',
  3: 'Accepted',
  4: 'Runtime Error',
  5: 'Wrong Answer',
  6: 'Time Limit Exceeded',
  7: 'Memory Limit Exceeded',
  8: 'Output Limit Exceeded',
  9: 'Presentation Error',
  10: 'System Error',
  11: 'Rejudge Pending',
  12: 'Skipped',
} as const

export const judgeList = Object.entries(result)
  .map(([ value, label ]) => ({
    value: Number.parseInt(value),
    label,
  }))

export const language = {
  1: 'C',
  2: 'C++ 11',
  3: 'Java',
  4: 'Python 3',
  5: 'C++ 17',
} as const

export const languageList = Object.entries(language)
  .map(([ value, label ]) => ({
    value: Number.parseInt(value),
    label,
  }))
  .sort((a, b) => a.label.localeCompare(b.label))

export const languageHighlight = {
  1: 'c',
  2: 'cpp',
  3: 'java',
  4: 'python',
  5: 'cpp',
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
