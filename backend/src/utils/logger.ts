import { env } from 'node:process'
import tracer from 'tracer'

// 故意略去时间: production 模式时会用另外的 package 将 log 输入文件，此时会附上时间戳
const format = env.NODE_ENV === 'test'
  ? ''
  : '<{{title}}> {{message}} (in {{file}}:{{line}})'

export default tracer.colorConsole({ format })
