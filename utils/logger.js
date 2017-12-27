// 故意略去时间: production 模式时会用另外的 package 将 log 输入文件，此时会附上时间戳
module.exports = require('tracer').colorConsole({
  format: '<{{title}}> {{message}} (in {{file}}:{{line}})'
})
