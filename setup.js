require('dotenv-flow').config()

const { resolve } = require('node:path')
const fse = require('fs-extra')

async function main () {
  const logDir = resolve(__dirname, 'logs')

  const pm2config = {
    apps: [
      {
        name: 'app',
        script: resolve(__dirname, 'app.js'),
        out_file: resolve(logDir, 'app.out.log'),
        error_file: resolve(logDir, 'app.err.log'),
        log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
        merge_logs: true,
        restart_delay: 500,
        env: {
          NODE_ENV: 'production',
        },
      },
      {
        name: 'updater',
        script: resolve(__dirname, 'services', 'updater.js'),
        out_file: resolve(logDir, 'updater.out.log'),
        error_file: resolve(logDir, 'updater.err.log'),
        log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
        merge_logs: true,
        env: {
          NODE_ENV: 'production',
        },
      },
      {
        name: 'worker',
        script: resolve(__dirname, 'services', 'worker.js'),
        out_file: resolve(logDir, 'worker.out.log'),
        error_file: resolve(logDir, 'worker.err.log'),
        log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
        merge_logs: true,
        env: {
          NODE_ENV: 'production',
        },
      },
    ],
  }

  return fse.outputJSON('pm2.config.json', pm2config, { spaces: 2, EOL: '\n' })
}

main()
  .then(() => {
    console.log('pm2.config.json created')
  })
  .catch((err) => {
    console.error(err)
  })
