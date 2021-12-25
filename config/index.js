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
  judgers: 2,
  adminInitPwd: 'kplkplkpl'
}

config.secretKey = process.env.secretKey

config.dbURL = process.env.DBURL || process.env.dbURL // 之所以两个只为了兼容旧版命名；请优先采用后者

config.mail = {
  enable: true, // set false to disable email notifications
  // https://nodemailer.com/about/
  host: 'smtp-mail.outlook.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.MAIL_ADDRESS,
    pass: process.env.MAIL_PASSWORD
  }
}

config.port = Number.parseInt(
  process.env.PORT
)

module.exports = config
