const config = {
  redisURL: process.env.redisURL
}

config.privilege = {
  PrimaryUser: 1,
  Teacher: 2,
  Root: 3
}

config.judge = {
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
  RejudgePending: 11
}

config.module = {
  Problem: 1,
  Contest: 2
}

const dev = {
  port: 8888,
  dbURL: process.env.DBURL
}

const prod = {
  port: 80,
  dbURL: 'mongodb://127.0.0.1:27017/oj'
}

module.exports = Object.assign(
  process.env.NODE_ENV === 'production' ? prod : dev,
  config
)
