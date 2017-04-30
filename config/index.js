const config = {
  port: 3000
}

config.redisUrl = 'redis://localhost:6379'

// 连接前记得配置 mongod, 如果是远端数据库
// http://stackoverflow.com/questions/13312358/mongo-couldnt-connect-to-server-127-0-0-127017
// 修改 /etc/mongod.conf； 注释 bind_ip 与 port
config.mongoUrl = 'mongodb://127.0.0.1:27017/oj'

module.exports = config
