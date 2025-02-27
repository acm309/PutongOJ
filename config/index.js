const process = require('node:process')

const config = {
  port: Number.parseInt(process.env.PORT || 3000),
  dbURL: String(process.env.dbURL),
  redisURL: String(process.env.redisURL),
  secretKey: String(process.env.secretKey),

  privilege: {
    Banned: 0,
    User: 1,
    Admin: 2,
    Root: 3,
  },

  judge: {
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
  },

  limitation: {
    time: 10 * 1000,
    memory: 256 * 1024,
  },

  // 是否开放给普通用户
  status: {
    Reserve: 0,
    Available: 2,
  },

  // 比赛类型
  encrypt: {
    Public: 1,
    Private: 2,
    Password: 3,
  },

  deploy: {
    judgers: 2,
    adminInitPwd: 'kplkplkpl',
  },

  mail: {
    // set false to disable email notifications
    enable: false,
    host: 'smtp-mail.outlook.com',
    port: 587,
    // true for 465, false for other ports
    secure: false,
    auth: {
      user: process.env.MAIL_ADDRESS,
      pass: process.env.MAIL_PASSWORD,
    },
  },
}

module.exports = config
