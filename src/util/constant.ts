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

export const judgeList = [
  {
    value: 0,
    label: 'Pending',
  },
  {
    value: 1,
    label: 'Running & Judge',
  },
  {
    value: 2,
    label: 'Compile Error',
  },
  {
    value: 3,
    label: 'Accepted',
  },
  {
    value: 4,
    label: 'Runtime Error',
  },
  {
    value: 5,
    label: 'Wrong Answer',
  },
  {
    value: 6,
    label: 'Time Limit Exceeded',
  },
  {
    value: 7,
    label: 'Memory Limit Exceeded',
  },
  {
    value: 8,
    label: 'Output Limit Exceeded',
  },
  {
    value: 9,
    label: 'Presentation Error',
  },
  {
    value: 10,
    label: 'System Error',
  },
  {
    value: 11,
    label: 'Rejudge Pending',
  },
  {
    value: 12,
    label: 'Skipped',
  },
] as const

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
  status,
  privilege,
} as const
