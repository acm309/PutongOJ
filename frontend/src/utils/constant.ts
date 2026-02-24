import type { CourseRole } from '@backend/types'
import { JudgeStatus, Language, UserPrivilege } from '@putongoj/shared'

export const languageHighlight: Record<Language, string> = {
  [Language.C]: 'c',
  [Language.Cpp11]: 'cpp',
  [Language.Cpp17]: 'cpp',
  [Language.Java]: 'java',
  [Language.PyPy]: 'python',
  [Language.Python]: 'python',
} as const

export const problemType = {
  1: 'Traditional',
  2: 'Interaction',
  3: 'Special Judge',
} as const

export const statusLabels = {
  0: 'Reserve', // 是否开放给普通用户
  2: 'Available',
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
