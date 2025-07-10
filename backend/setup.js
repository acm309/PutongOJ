require('dotenv-flow').config()

const { resolve } = require('node:path')
const { env } = require('node:process')
const { outputJSON } = require('fs-extra')

const baseDir = resolve(__dirname, 'dist')
const logsDir = resolve(__dirname, 'logs')
const jobsDir = resolve(baseDir, 'jobs')

const WORKER_INSTANCES = Number.parseInt(env.PTOJ_WORKER_INSTANCES, 10) || 2

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
    name: 'updater',
    script: resolve(jobsDir, 'updater.js'),
    out_file: resolve(logsDir, 'updater.out.log'),
    error_file: resolve(logsDir, 'updater.err.log'),
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

  outputJSON(
    resolve(__dirname, 'pm2.config.json'),
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
