import { resolve } from 'node:path'
import process from 'node:process'
import dotenvFlow from 'dotenv-flow'
import fse from 'fs-extra'

dotenvFlow.config({ silent: true })

const serverDistDir = resolve(import.meta.dirname, 'apps/server/dist')
const wsServerDistDir = resolve(import.meta.dirname, 'apps/ws-server/dist')
const workerDistDir = resolve(import.meta.dirname, 'apps/worker/dist')
const judgerDistDir = resolve(import.meta.dirname, 'apps/judger/dist')
const logsDir = resolve(import.meta.dirname, 'logs')

const WORKER_INSTANCES = Number.parseInt(process.env.PTOJ_WORKER_INSTANCES, 10) || 2
const JUDGER_INSTANCES = Number.parseInt(process.env.PTOJ_JUDGER_INSTANCES, 10) || 1

async function main () {
  const apps = []
  const commons = {
    env: {
      NODE_ENV: 'production',
    },
    restart_delay: 1000,
    merge_logs: true,
  }

  apps.push({
    name: 'app',
    script: resolve(serverDistDir, 'app.js'),
    out_file: resolve(logsDir, 'app.out.log'),
    error_file: resolve(logsDir, 'app.err.log'),
    ...commons,
  })
  apps.push({
    name: 'ws',
    script: resolve(wsServerDistDir, 'index.js'),
    out_file: resolve(logsDir, 'ws.out.log'),
    error_file: resolve(logsDir, 'ws.err.log'),
    ...commons,
  })
  apps.push({
    name: 'judger',
    script: resolve(judgerDistDir, 'main.js'),
    exec_mode: 'cluster',
    instances: JUDGER_INSTANCES,
    out_file: resolve(logsDir, 'judger.out.log'),
    error_file: resolve(logsDir, 'judger.err.log'),
    ...commons,
    env: {
      ...commons.env,
      PTOJ_DATA_DIR: '/app/apps/server/data',
      PTOJ_SANDBOX_DATA_DIR: '/app/data',
    },
  })
  apps.push({
    name: 'worker',
    script: resolve(workerDistDir, 'main.js'),
    exec_mode: 'cluster',
    instances: WORKER_INSTANCES,
    out_file: resolve(logsDir, 'worker.out.log'),
    error_file: resolve(logsDir, 'worker.err.log'),
    ...commons,
    env: {
      ...commons.env,
      PTOJ_UPLOAD_DIR: '/app/apps/server/public/uploads',
    },
  })

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
