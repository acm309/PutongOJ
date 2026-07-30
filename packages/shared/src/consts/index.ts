import { JudgeStatus } from '@putongoj/db/browser'

export * from './keywords.js'
export * from './limit.js'
export * from './regex.js'
export {
  CourseVisibility,
  DiscussionType,
  JudgeStatus,
  LabelingStyle,
  Language,
  ParticipationStatus,
  ProblemJudgeType,
  ProblemVisibility,
  TagColor,
  UserPrivilege,
} from '@putongoj/db/browser'

export enum ErrorCode {
  BadRequest = 400,
  Unauthorized = 401,
  Forbidden = 403,
  NotFound = 404,
  Conflict = 409,
  Teapot = 418,
  InternalServerError = 500,
  NotImplemented = 501,
}

export const ErrorCodeValues = Object.values(ErrorCode)
  .filter(value => typeof value === 'number') as number[]

export enum QuerySort {
  Asc = 1,
  Desc = -1,
}

export enum OAuthProvider {
  CJLU = 'cjlu',
  Codeforces = 'codeforces',
}

export enum OAuthAction {
  LOGIN = 'login',
  CONNECT = 'connect',
}

export const JUDGE_STATUS_TERMINAL = [
  JudgeStatus.COMPILE_ERROR,
  JudgeStatus.ACCEPTED,
  JudgeStatus.RUNTIME_ERROR,
  JudgeStatus.WRONG_ANSWER,
  JudgeStatus.TIME_LIMIT_EXCEEDED,
  JudgeStatus.MEMORY_LIMIT_EXCEEDED,
  JudgeStatus.OUTPUT_LIMIT_EXCEEDED,
  JudgeStatus.PRESENTATION_ERROR,
  JudgeStatus.SYSTEM_ERROR,
] as const

export enum ExportFormat {
  JSON_UTF8 = 'json-utf8',
  CSV_UTF8 = 'csv-utf8',
  CSV_UTF8_BOM = 'csv-utf8-bom',
}

export enum TestcaseFileType {
  Input = 'in',
  Output = 'out',
}
