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
