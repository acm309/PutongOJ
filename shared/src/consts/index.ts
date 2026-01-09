export * from './keywords.js'
export * from './limit.js'
export * from './regex.js'

export enum ErrorCode {
  NetworkError = -1,
  OK = 200,
  BadRequest = 400,
  Unauthorized = 401,
  Forbidden = 403,
  NotFound = 404,
  Conflict = 409,
  Teapot = 418,
  InternalServerError = 500,
  NotImplemented = 501,
}

export enum QuerySort {
  Asc = 1,
  Desc = -1,
}

export enum UserPrivilege {
  Banned = 0,
  User = 1,
  Admin = 2,
  Root = 3,
}

export const OAuthProvider = {
  CJLU: 'CJLU',
  Codeforces: 'Codeforces',
} as const

export type OAuthProvider = typeof OAuthProvider[keyof typeof OAuthProvider]

export const OAuthAction = {
  LOGIN: 'login',
  CONNECT: 'connect',
} as const

export type OAuthAction = typeof OAuthAction[keyof typeof OAuthAction]

export enum JudgeStatus {
  Pending = 0,
  RunningJudge = 1,
  CompileError = 2,
  Accepted = 3,
  RuntimeError = 4,
  WrongAnswer = 5,
  TimeLimitExceeded = 6,
  MemoryLimitExceeded = 7,
  OutputLimitExceeded = 8,
  PresentationError = 9,
  SystemError = 10,
  RejudgePending = 11,
  Skipped = 12,
}

export enum Language {
  C = 1,
  Cpp11 = 2,
  Cpp17 = 5,
  Java = 3,
  PyPy = 6,
  Python = 4,
}

export enum ExportFormat {
  JSON_UTF8 = 'json-utf8',
  CSV_UTF8 = 'csv-utf8',
  CSV_UTF8_BOM = 'csv-utf8-bom',
}

export enum TestcaseFileType {
  Input = 'in',
  Output = 'out',
}

export enum DiscussionType {
  OpenDiscussion = 1,
  PublicAnnouncement = 2,
  PrivateClarification = 3,
  ArchivedDiscussion = 4,
}

export const ParticipationStatus = {
  NotApplied: 0,
  Pending: 1,
  Rejected: 2,
  Suspended: 3,
  Approved: 4,
} as const

export type ParticipationStatus = typeof ParticipationStatus[keyof typeof ParticipationStatus]

export const LabelingStyle = {
  Numeric: 1,
  Alphabetic: 2,
} as const

export type LabelingStyle = typeof LabelingStyle[keyof typeof LabelingStyle]
