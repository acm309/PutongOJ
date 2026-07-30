import type { CourseRole } from '@putongoj/shared'
import {
  DiscussionType,
  JudgeStatus,
  Language,
  ProblemJudgeType,
  ProblemVisibility,
  UserPrivilege,
} from '@putongoj/shared'

export const languageHighlight: Record<Language, string> = {
  [Language.C]: 'c',
  [Language.CPP_11]: 'cpp',
  [Language.CPP_17]: 'cpp',
  [Language.JAVA]: 'java',
  [Language.PYPY]: 'python',
  [Language.PYTHON]: 'python',
} as const

export const problemJudgeTypeLabels: Record<ProblemJudgeType, string> = {
  [ProblemJudgeType.TRADITIONAL]: 'Traditional',
  [ProblemJudgeType.INTERACTION]: 'Interaction',
  [ProblemJudgeType.SPECIAL_JUDGE]: 'Special Judge',
} as const

export const problemVisibilityLabels: Record<ProblemVisibility, string> = {
  [ProblemVisibility.RESERVED]: 'Reserved',
  [ProblemVisibility.AVAILABLE]: 'Available',
} as const

export const courseRoleFields: readonly (keyof CourseRole)[] = [
  'canAccess',
  'canViewTestcases',
  'canViewSubmissions',
  'canManageProblems',
  'canManageContests',
  'canManageCourse',
]

export const privilegeOptions = [
  { label: 'Banned', value: UserPrivilege.BANNED },
  { label: 'User', value: UserPrivilege.USER },
  { label: 'Admin', value: UserPrivilege.ADMIN },
  { label: 'Root', value: UserPrivilege.ROOT },
]

export const judgeStatusLabels: Record<JudgeStatus, string> = {
  [JudgeStatus.PENDING]: 'Pending',
  [JudgeStatus.RUNNING_JUDGE]: 'Running & Judge',
  [JudgeStatus.COMPILE_ERROR]: 'Compile Error',
  [JudgeStatus.ACCEPTED]: 'Accepted',
  [JudgeStatus.RUNTIME_ERROR]: 'Runtime Error',
  [JudgeStatus.WRONG_ANSWER]: 'Wrong Answer',
  [JudgeStatus.TIME_LIMIT_EXCEEDED]: 'Time Limit Exceeded',
  [JudgeStatus.MEMORY_LIMIT_EXCEEDED]: 'Memory Limit Exceeded',
  [JudgeStatus.OUTPUT_LIMIT_EXCEEDED]: 'Output Limit Exceeded',
  [JudgeStatus.PRESENTATION_ERROR]: 'Presentation Error',
  [JudgeStatus.SYSTEM_ERROR]: 'System Error',
  [JudgeStatus.REJUDGE_PENDING]: 'Rejudge Pending',
  [JudgeStatus.SKIPPED]: 'Skipped',
} as const

export const judgeStatusOptions = Object.entries(judgeStatusLabels)
  .map(([ value, label ]) => ({ label, value }))

export const languagesOrder: Language[] = [
  Language.CPP_11,
  Language.CPP_17,
  Language.C,
  Language.JAVA,
  Language.PYTHON,
  Language.PYPY,
]

export const languageLabels: Record<Language, string> = {
  [Language.C]: 'C',
  [Language.CPP_11]: 'C++ 11',
  [Language.CPP_17]: 'C++ 17',
  [Language.JAVA]: 'Java',
  [Language.PYPY]: 'PyPy 3',
  [Language.PYTHON]: 'Python 3',
}

export const discussionTypeOptions = [
  { label: 'Discussion', value: DiscussionType.OPEN_DISCUSSION },
  { label: 'Announcement', value: DiscussionType.PUBLIC_ANNOUNCEMENT },
  { label: 'Clarification', value: DiscussionType.PRIVATE_CLARIFICATION },
]

export const languageOptions = languagesOrder.map(lang => ({
  label: languageLabels[lang],
  value: lang,
}))
