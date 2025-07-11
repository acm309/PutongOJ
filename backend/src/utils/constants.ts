export const privilege = Object.freeze({
  Banned: 0,
  User: 1,
  Admin: 2,
  Root: 3,
})

const judge = Object.freeze({
  Pending: 0,
  Running: 1,
  CompileError: 2,
  Accepted: 3,
  RuntimeError: 4,
  WrongAnswer: 5,
  TimeLimitExceeded: 6,
  MemoryLimitExceed: 7,
  OutputLimitExceed: 8,
  PresentationError: 9,
  SystemError: 10,
  RejudgePending: 11,
  Skipped: 12,
})

const limitation = Object.freeze({
  time: 10 * 1000,
  memory: 256 * 1024,
})

const status = Object.freeze({
  Reserve: 0,
  Available: 2,
})

export const encrypt = Object.freeze({
  Public: 1,
  Private: 2,
  Password: 3,
})

const problemType = Object.freeze({
  Traditional: 1,
  Interaction: 2,
  SpecialJudge: 3,
})

const deploy = Object.freeze({
  adminInitPwd: 'kplkplkpl',
})

export default Object.freeze({
  deploy,
  encrypt,
  judge,
  limitation,
  privilege,
  problemType,
  status,
})
