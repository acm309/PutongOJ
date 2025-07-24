type ErrorTuple = Readonly<[number, string]>

export const ERR_INVALID_ID: ErrorTuple = Object.freeze([
  400, 'Invalid entity ID, please check the parameters.' ])
export const ERR_LOGIN_REQUIRE: ErrorTuple = Object.freeze([
  401, 'Unauthenticated user, please login first.' ])
export const ERR_PERM_DENIED: ErrorTuple = Object.freeze([
  403, 'Permission denied, you do not have the required privileges.' ])
export const ERR_NOT_FOUND: ErrorTuple = Object.freeze([
  404, 'Entity not found, please check the ID.' ])
export const ERR_UNKNOWN: ErrorTuple = Object.freeze([
  500, 'Unknown error, sit back and relax, it is not your fault.' ])
