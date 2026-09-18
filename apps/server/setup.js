import { resolve } from 'node:path'
import process from 'node:process'
import dotenvFlow from 'dotenv-flow'
import fse from 'fs-extra'

dotenvFlow.config()

const baseDir = resolve(import.meta.dirname, 'dist')
const logsDir = resolve(import.meta.dirname, 'logs')
const jobsDir = resolve(baseDir, 'jobs')

const WORKER_INSTANCES = Number.parseInt(process.env.PTOJ_WORKER_INSTANCES, 10) || 2

async function main () {
  const apps = []
  const commons = {
    env: {
      NODE_ENV: 'production',
    },
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    restart_delay: 1000,
    merge_logs: true,
  }

  apps.push({
    name: 'app',
    script: resolve(baseDir, 'app.js'),
    out_file: resolve(logsDir, 'app.out.log'),
    error_file: resolve(logsDir, 'app.err.log'),
    ...commons,
  })
  apps.push({
    name: 'ws',
    script: resolve(baseDir, 'ws.js'),
    out_file: resolve(logsDir, 'ws.out.log'),
    error_file: resolve(logsDir, 'ws.err.log'),
    ...commons,
  })
  for (let i = 0; i < WORKER_INSTANCES; i++) {
    apps.push({
      name: 'worker',
      script: resolve(jobsDir, 'worker.js'),
      out_file: resolve(logsDir, `worker-${i}.out.log`),
      error_file: resolve(logsDir, `worker-${i}.err.log`),
      ...commons,
    })
  }

  fse.outputJSON(
    resolve(import.meta.dirname, 'pm2.config.json'),
    { apps },
    { spaces: 2, EOL: '\n' },
  )
}

main()
  .then(() => {
    console.log('pm2.config.json created')
  })
  .catch((err) => {
    console.error(err)
  })
