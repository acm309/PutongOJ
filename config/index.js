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

// 是否开放给普通用户
config.status = {
  Reserve: 0,
  Available: 2
}

// 比赛类型
config.encrypt = {
  Public: 1,
  Private: 2,
  Password: 3
}

config.deploy = {
  judgers: 1
}

const dev = {
  port: 8888,
  dbURL: process.env.DBURL
}

const prod = {
  port: 80,
  dbURL: 'mongodb://127.0.0.1:27017/devoj'
}

module.exports = Object.assign(
  process.env.NODE_ENV === 'production' ? prod : dev,
  config
)
