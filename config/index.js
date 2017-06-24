const path = require('path')

const config = {
  port: 3000
}

config.redisUrl = 'redis://localhost:6379'

// 连接前记得配置 mongod, 如果是远端数据库
// http://stackoverflow.com/questions/13312358/mongo-couldnt-connect-to-server-127-0-0-127017
// 修改 /etc/mongod.conf； 注释 bind_ip 与 port
config.mongoUrl = 'mongodb://192.168.1.177:27017/oj'

// 以下常量一部分来自历史原因
// 一部分参考自: https://github.com/ZJGSU-Open-Source/GoOnlineJudge/blob/master/config/config.go
config.privilege = {
  PrimaryUser: 1,
  Teacher: 2,
  Admin: 3
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
  Contest: 2 // 这是比赛的提交还是普通的提交，这个设置完全是历史遗留原因，我也不知道这个字段有用么？
}

config.status = {
  Reserve: 0, // 是否开放给普通用户
  Available: 2
}

config.encrypt = {
  Public: 1,
  Private: 2, // 只有在特定列表中的人才能访问
  Password: 3
}

config.language = {
  C: 1,
  Cpp: 2,
  Java: 3
}

config.root = path.resolve(__dirname, '..')
config.DataRoot = path.resolve(config.root, './data/Data')

module.exports = config
