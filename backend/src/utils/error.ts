type ErrorTuple = Readonly<[number, string]>

export enum ErrorCode {
  OK = 200,
  BadRequest = 400,
  Unauthorized = 401,
  Forbidden = 403,
  NotFound = 404,
  Teapot = 418,
  InternalServerError = 500,
  NotImplemented = 501,
}

export const ERR_INVALID_ID: ErrorTuple = [
  ErrorCode.BadRequest,
  'Invalid entity ID, please check the parameters.',
] as const

export const ERR_BAD_PARAMS: ErrorTuple = [
  ErrorCode.BadRequest,
  'Bad request parameters, please check the parameters.',
] as const

export const ERR_LOGIN_REQUIRE: ErrorTuple = [
  ErrorCode.Unauthorized,
  'Unauthenticated user, please login first.',
] as const

export const ERR_PERM_DENIED: ErrorTuple = [
  ErrorCode.Forbidden,
  'Permission denied, you do not have the required privileges.',
] as const

export const ERR_NOT_FOUND: ErrorTuple = [
  ErrorCode.NotFound,
  'Entity not found, please check the ID.',
] as const

export const ERR_UNKNOWN: ErrorTuple = [
  ErrorCode.InternalServerError,
  'Unknown error, sit back and relax, it is not your fault.',
] as const
