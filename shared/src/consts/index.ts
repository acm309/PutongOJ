export * from './keywords.js'

export enum ErrorCode {
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
