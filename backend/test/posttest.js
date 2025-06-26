const process = require('node:process')

require('dotenv-flow').config()
require('../src/config/db')
const { removeall } = require('./helper')

async function main () {
  return removeall()
}

main()
  .then(() => {
    process.exit(0)
  })
