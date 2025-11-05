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

export enum OAuthProvider {
  CJLU = 'CJLU',
}

export enum OAuthAction {
  LOGIN = 'login',
  CONNECT = 'connect',
}

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
